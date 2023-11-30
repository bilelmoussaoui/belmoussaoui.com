+++
title = "Reducing Mutter dependencies"
date = 2023-11-30
draft = false

[taxonomies]
categories = ["Graphics"]
tags = ["Graphics", "Compositor", "GNOME"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++


Mutter, if you don't know what it is, is a Wayland display server and an X11 window manager and compositor library. It used by [GNOME Shell](https://gitlab.gnome.org/GNOME/gnome-shell/), [Gala](https://github.com/elementary/gala/), [GNOME Kiosk](https://gitlab.gnome.org/GNOME/gnome-kiosk/) and possibly other old forks out there.

The project was born from merging [Clutter](https://gitlab.gnome.org/Archive/clutter), [Cogl](https://gitlab.gnome.org/Archive/cogl) and [Metacity](https://en.wikipedia.org/wiki/Metacity) so it has/had a lot of cruft and technical debts carried over time.

In this blog post, I will go through the list of things I worked on the last few months to reduce that and my plans for the upcoming year.

## Reducing build/runtime dependencies

After going through the list of dependencies used by Mutter, in a Wayland-only use case, I found the following ones that could potentially be completely removed or made optional

### zenity

A runtime dependency, it was used to display various "complex" X11-specific dialogues that can't be replicated easily using Clutter.

Those dialogs were no longer useful and the dependency got removed in [!2370](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2370). Note that Mutter still uses Zenity for x11-specific tests.

### libcanberra

Used by Mutter to play sounds in some contexts and also provides a public API to do so, in your custom shell. For embedded use cases, the functionality is not useful, especially since libcanberra ends up pulling gstreamer.

With [!2375](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2375), the functionality can be disabled at build time with `-Dsound_player=false` making [`MetaSoundPlayer`](https://gnome.pages.gitlab.gnome.org/mutter/meta/class.SoundPlayer.html) not produce any sound.

### gnome-desktop

Used internally by Mutter to retrieve the monitor vendor name before falling back to "Undefined".

With [!2317](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2317), the functionality can be disabled with `-Dlibgnome_desktop=false`

### gnome-settings-daemon

A runtime dependency that provides the `org.gnome.settings-daemon.peripherals.touchscreen orientation-lock` setting, which is used to disable automatically updating the display orientation.

With [!2398](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2398), Mutter checks if the setting scheme is available first making the runtime dependency optional.

### gtk

Under X11, GTK is used for drawing the window decorations. Some parts of GTK APIs ended up being used elsewhere for simplicity at that time. Ideally, shortly, we would have the possibility to build Mutter without x11 support, keeping the GTK dependency in that case doesn't make much sense.

With [!2407](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2407), the usage of GTK inside Mutter was reduced to drawing the window clients decorations, which Carlos Garnacho took care of handling in [!2175](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2175).

### json-glib

Clutter, could create [`ClutterActor`](https://gnome.pages.gitlab.gnome.org/mutter/clutter/class.Actor.html)s from a JSON file, but nothing is using that feature since the merge of Clutter inside Mutter. The library was also used to serialize [`ClutterPaintNode`](https://gnome.pages.gitlab.gnome.org/mutter/clutter/class.PaintNode.html)s for debugging purposes.

With [!3354](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3354), both use cases were removed and the dependency was dropped.

### gdk-pixbuf

The library was used to provide APIs for creating [`CoglTexture`](https://gnome.pages.gitlab.gnome.org/mutter/cogl/class.Texture.html)s or [`CoglBitmap`](https://gnome.pages.gitlab.gnome.org/mutter/cogl/class.Bitmap.html) from a file and internally with [`MetaBackgroundImageCache`](https://gnome.pages.gitlab.gnome.org/mutter/meta/class.BackgroundImageCache.html)for caching the background textures.

With [!3097](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3097), we only have the `MetaBackgroundImageCache` use case which needs some refactoring.

### cairo

When I looked at building Mutter without X11, I noticed that cairo ends up pulling some X11 bits through the cairo-xlib backend and wondered how hard it would be to completely get rid of cairo usage in the Wayland-only code path.

The first step in this adventure was to [replace `cairo_rectangle_int_t`](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3128), especially since Mutter had a `MetaRectangle` type anyways...But that meant [replacing `cairo_region_t` as well](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3292), which thankfully is just a ref counted `pixman_region32_t` wrapper. With those two changes, the cairo usage dropped drastically but was still far from enough.

- [`MetaWindow:icon`](https://gnome.pages.gitlab.gnome.org/mutter/meta/property.Window.icon.html) / [`MetaWindow:mini-icon`](https://gnome.pages.gitlab.gnome.org/mutter/meta/property.Window.mini-icon.html) uses a `cairo_surface_t` which probably can either be dropped or replaced with something like a `CoglTexture`
- [`ClutterCanvas`](https://gnome.pages.gitlab.gnome.org/mutter/clutter/class.Canvas.html) uses cairo for drawing. It is only used by `StDrawingArea`, a `ClutterActor` subclass provided in GNOME Shell. The idea is to merge both in GNOME Shell and drop that API from Mutter
- pango / pangocairo integration, which opens the question of whether the whole font rendering bits should be moved to GNOME Shell and leave Mutter outside of that business or if it should be made optional
- Other use cases requiring case-by-case handling

### X11

Well, Wayland is no news and Xwayland support allows keeping backward compatibility with X11-only applications. The idea is to allow building Mutter with Wayland only with or without Xwayland.

I have opened [#2272](https://gitlab.gnome.org/GNOME/mutter/-/issues/2272) which keeps track of the progress as well as the remaining tasks if someone is interested in helping with that!

## Replacing/Removing deprecated APIs

Cogl/Clutter before being merged with Metacity contained various deprecated APIs that were intended to be removed in the next major release of those libraries, which never happened. With the help of Zander Brown and Florian Müllner, we have managed to significantly reduce those.

Cogl also contained a `CoglObject` base class that is not a `GObject` for historical reasons. I took it as a personal challenge to [get rid of it](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3193)

## Improving documentation of the public API

Mutter and its various libraries already had a build time option to generate docs using [gi-docgen](https://gitlab.gnome.org/GNOME/gi-docgen) but the CI wasn't building and publishing them somewhere on Gitlab Pages. I [have](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2441) [also](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2708) [ported](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2939) portion of the documentation to use gi-docgen annotations instead of the old gtk-doc way.

There is still a lot of work to be done to improve the quality of the documentation but we are getting there.

The docs are nowadays available at <https://gitlab.gnome.org/GNOME/mutter#contributing>.

## Next year?

When I look back at the amount of changes I have managed to contribute to Mutter the last few months, I don't believe it was that much, but at the same time remind myself there is still a lot to be done, as usual.

For next year, I plan to continue pushing forward the effort to build Mutter without x11 / cairo / gdk-pixbuf and various upstream involvement where possible.

Till then, stay safe
