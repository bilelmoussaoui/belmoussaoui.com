+++
title = "Read It Later, yet an other GTK & Rust application"
date = 2020-02-04
draft = false

[taxonomies]
categories = ["GNOME", "Rust", "Updates"]
tags = ["GNOME", "Rust"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

Late last year, I wanted to find an application that I can try the Rust async features with it. I started looking for a service that had a nice Rust API wrapper already and I started prototyping Read It Later on top of [wallabag-rs](https://github.com/swalladge/wallabag-rs/).

Read It Later, is a well designed [Wallabag](https://www.wallabag.it/en) client.  It’s built with Rust, GTK & libhandy on the UI side. It’s fully adaptive which makes it Linux on pocket ready and also comes with a beautiful icon designed by [Tobias Bernard](https://tobiasbernard.com/).

![App Icon Preview](/posts/7-first-release-read-it-later/image.png)

Screenshot taken using App Icon Preview

It allows you to do the basic things:

- Login/Logout/Sync
- Add/Favorite/Archive/Delete an article
- Dark Mode Reader
- Adaptive UI

![Login View](/posts/7-first-release-read-it-later/Screenshot-from-2020-02-05-20-15-48.png)

![Articles View](/posts/7-first-release-read-it-later/screenshot1.png)

![Article View](/posts/7-first-release-read-it-later/screenshot2.png)

![Adaptive View](/posts/7-first-release-read-it-later/screenshot3.png)

You can grab it already from Flathub at <https://flathub.org/apps/details/com.belmoussaoui.ReadItLater>. If you would like to contribute, the source code is available at <https://gitlab.gnome.org/bilelmoussaoui/read-it-later>

So far, writing apps with GTK & Rust have been a fun experience. GNOME Builder & Flatpak made the developer experience smooth 🙂