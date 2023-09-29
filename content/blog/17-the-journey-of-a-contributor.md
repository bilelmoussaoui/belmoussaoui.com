+++
title = "The journey of an open source contributor"
date = 2023-09-29
draft = false

[taxonomies]
categories = ["Open Source"]
tags = []

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

## The journey

In early 2019, the [GNOME project](https://www.gnome.org/) migrated to GitLab which for someone unfamiliar at that time with submitting patches by email it was the perfect timing to get involved.

I started from the very bottom of the stack by [contributing to the Appdata/Metainfo](../1-gnome-initiative-appdata/) files of various applications. If you are not familiar with such files, they are used to describe the application to the Application Store by providing a name, screenshots, various links and release notes.

### Sound Recorder

The sound recorder application built for the GNOME desktop at that time was unmaintained, it didn't follow the up to date paradigms of building a modern GTK application. So I proposed a [Google Summer of Code in 2020](https://summerofcode.withgoogle.com/archive/2020/projects/5926277921374208) to modernize the code base. The project ended up being a success from an engineering point of view but the social/community aspect of it wasn't what I expected.

### Clocks

Few months after taking over Sound Recorder, I convinced Zander Brown to join effort and [modernize Clocks](../9-tick-tock-clocks-got-redesigned). This time, I was involved in updating two panels out of the fourth that Clocks has instead of mentoring someone to do it. Thanks to the extensive reviews I got from Zander, it helped me a lot learn a ton of new things.

### Design tooling

Just before deciding to become the maintainer of yet another application. Few people in the GNOME community were trying to convince me about this fancy new programming language called Rust. So instead of contributing to an existing code base I decided to write a Rust application called [Contrast](https://gitlab.gnome.org/World/design/contrast) and then an other one called [Icon Library](https://gitlab.gnome.org/World/design/icon-library). I hated Rust at that time or to be more precise I hated the incomplete GTK 3 Rust bindings. The lack of composite templates support, creating custom widgets in GTK 3 being difficult and the huge amount of boilerplate involved in the process so somehow I found myself contributing few things here and there to the gtk-rs bindings.

I ended up also writing [Symbolic Preview](https://gitlab.gnome.org/World/design/symbolic-preview/) and porting [App Icon Preview](https://gitlab.gnome.org/World/design/app-icon-preview/) from Vala to Rust.

### Characters

Somehow, I still didn't learn the lesson and decided with Christopher Davis this time to take over Characters. I did a huge clean up of the code base, which helped with porting it to GTK 4 later.

### Bindings, bindings everywhere

Few months before the first release of GTK 4, I was already familiar with the basics of how the Rust bindings of GObject based libraries are generated. We had a very rough, experimental and no longer working GTK 4 bindings at that time and I decided that if we are going to make Rust the go to language for writing your next pet GTK application, this has to be our chance.

So I rebased the bindings and made them work with the latest APIs changes upstream, contributed a ton of code to GIR. The unfortunately named like that tool to generate Rust bindings from a GIR file. I have also worked on fixing annotation in the APIs upstream and ended up taking more and more responsibilities in the Rust bindings ecosystem.

Of course, great bindings are nice but we also need various important libraries to make the GTK 4 Rust bindings an attractive option. So I wrote ASHPD for interacting with the portals, bootstrapped a GStreamer plugin so you can render your camera stream or a video into a GTK widget, made it much simpler to write a GNOME Shell Search provider and recently co-rewrote libsecret in Rust.

## New adventures

Since I joined Red Hat last year, I have been writing C. Yes, as you read it C. And to be honest? I enjoy it but I hate it at the same time.

This opportunity allowed me to learn more which has been the purpose of this journey so far. It also allowed me to contribute various patches to Mutter and recently to QEMU and help Christian Hergert with [libmks](https://gitlab.gnome.org/GNOME/libmks/).

So far the journey has been amazing and the learning never stops but at some point, one has to stop thinking that a single person can maintain 10+ applications, 50+ Rust crates, have a full time job and keep a decent social life.
If you notice a commit dropping myself from the maintainers list of a project; now you would know why.
