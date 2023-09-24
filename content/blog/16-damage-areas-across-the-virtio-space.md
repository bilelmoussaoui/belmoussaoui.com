+++
title = "Damage areas across the VirtIO space"
date = 2023-08-15
draft = false

[taxonomies]
categories = ["Graphics"]
tags = ["QEMU", "GTK"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

In the last few months, I have been trying to improve the default UI shipped by [QEMU](https://www.qemu.org/). As you might not know, QEMU ships with various UI backends: GTK, SDL, Cocoa and recently a DBus one.

I first started trying to port the GTK 3 backend to GTK 4 but faced some issues where I couldn't use `GtkApplication` as it starts its own `GMainLoop` which interferes with some god knows what internal `GMainLoop` started by QEMU itself. My intention was not to only do a simple port but also to see how we could optimize the rendering path as well.

At that time, I also learned that Christian Hergert started working on [libmks](https://gitlab.gnome.org/GNOME/libmks), a new client-side C library of the DBus backend as he has the intention of using it in GNOME Builder. Marc-André Lureau, one of the upstream QEMU maintainers, is also working on something similar, with a larger scope and using Rust called [RDW](https://gitlab.com/marcandre.lureau/qemu-display/), a Remote Desktop Widget to rule them all.

## Damage areas

From a rendering perspective, the major difference between libmks and RDW at that time is that libmks used a custom `GdkPaintable` doing a tiled rendering of a `GLTexture` imported from a `DMABuf` as GTK had no API to set the damaged region of a `GLTexture` and it was doing a pointer comparison for a `GSK_TEXTURE_NODE` render nodes, hence the usage of a tiled rendering. RDW on the other hand was using a plain `GtkGLArea`.

Christian Hergert also shared with Javier Martinez Canillas and me about his findings while working on libmks:

- The VirtIO GPU DRM driver wasn't enabling the frame buffer damage clips property causing a full scanout. This is now fixed thanks to Javier <https://www.spinics.net/lists/kernel/msg4715781.html>

- QEMU wasn't propagating the damaged area properly which is also fixed thanks to Christian who wrote the initial patch & I slightly changed it to use Pixman instead of Cairo <https://patchew.org/QEMU/20230814125802.102160-1-belmouss@redhat.com/>

So now that we have fixed the VirtIO GPU driver and QEMU, we should be able to get proper damage reporting information from the guest, right??? Well, that is what Javier & I were hoping for. A few days into debugging what was going on without much luck, I met Robert Mader during Linux App Summit and discussed the issue with him and he mentioned a certain deny list of drivers from using the atomic KMS API in Mutter. Interesting.

The Monday after LAS, I shared the info with Javier and we found out the [root cause](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2040) of our pain. As the atomic KMS API has no properties for setting the cursor hotspot, which is useful for the virtualized use case, it was put on a deny list until such properties are added to the kernel. Javier also found that Zack Rusin from VMware is already on it, he submitted a [patch for the kernel](https://lore.kernel.org/all/20220712033246.1148476-1-zack@kde.org/#r) and had a local branch for Mutter as well. Albert Esteve tested the Kernel/Mutter patches and confirmed they were good. He also wrote an [IGT](https://gitlab.freedesktop.org/drm/igt-gpu-tools) test, which will hopefully help get the patch merged soon.

Around that time, Benjamin Otte was working on adding a new builder-like API to simplify the creation of a `GdkGLTexture`, with a very neat feature, allowing to set the exact damage region instead of doing a pointer comparison. I offered to test the API and ported libmks to use it.

## Other improvements

Sergio Lopez Pascual worked on adding multi-touch support to virtio-input/QEMU which I then exposed on the QEMU DBus interface & implemented the libmks side of it.

## For the future

- We still don't have all the required features to make libmks a drop-in replacement for Spice usage in GNOME Boxes like [USB redirection](https://gitlab.gnome.org/GNOME/libmks/-/issues/10), [Clipboard sharing](https://gitlab.gnome.org/GNOME/libmks/-/issues/7). I have WIP branches for both, one day I will finish them.
- Porting GNOME Boxes to GTK 4
- The Kernel / Mutter patches from Zack being merged

Once all these pieces land, you will hopefully be able to enjoy a slightly better experience when running a virtualized OS that properly propagates the damaged regions.

For now, you can try libmks either by using the debugging tool shipped with the library or by using this very small client I wrote on top of it, [Snowglobe](https://gitlab.gnome.org/bilelmoussaoui/snowglobe).

## Acknowledgement

As you can tell, a bunch of components and people were involved in this few months trip. I would like to thank everyone for taking the time to explain basic things to me as well as helping out to get this done! You can now enjoy a well deserved screen recording showing the implication of these changes

<video controls>
  <source src="/posts/16-damage-areas-across-the-virtio-space/libmks.webm" type="video/webm" />

  Download the
  <a href="/posts/16-damage-areas-across-the-virtio-space/libmks.webm">WEBM</a>
  video.
</video>
