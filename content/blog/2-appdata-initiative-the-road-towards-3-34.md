+++
title = "AppData Initiative: the road towards 3.34"
date = 2019-05-04
draft = false

[taxonomies]
categories = ["GNOME", "Updates"]
tags = ["GNOME"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = true
+++

Hey! Don't know if you still remember about the AppData update initiative I started two months ago, in this article I will try to put some lights on the progress I have done so far.

So, things started with updating the AppData files of various GNOME apps, even third-party ones, in order to provide the best description of the applications on any software center out there. While doing that for some core apps, I got a bit bored as it's the same thing that should be done for almost every application:

- Check if the application is using the same application ID everywhere and uses that for the FreeDesktop files

- Update the AppData file to the latest specs

- Add tests to validate the AppData & Desktop files

Then I checked some GNOME old classy games like Mines, Mahjongg and seen that a lot of them are still using that old build system that no one remembers in 2019, ehem, Autotools. I decided to give this games a bit of refresh to help newcomers to contribute pretty easily, I went ahead and created a simple Google Sheet with all the games and what needs to be done to improve the new contributor's life.

![Tracking sheet](/posts/2-appdata-initiative-the-road-towards-3-34/games-update.png)

As you can clearly see, there's a lot of green on that table, things were not the same in 3.30. I migrated a bunch of those projects to Meson, added a Flatpak manifest, a CI to build a Flatpak bundle to make the testing easier and allow the clone & hack work-flow that Builder + Flatpak allow us to do, updated the AppData of these games. Some of these changes were done by other contributors or the current maintainers of these games.

I also went ahead and did the same for some third-party applications I contribute to like Tilix, FeedReader...

## What's left to do?

I'm hoping to get the whole applications core and third-party GNOME apps up to the new specs before 3.34, there's still a lot of apps that need to be either ported to Meson, have a Flatpak manifest, needs an updated AppData or just some new fresh beautiful screenshots. I try to keep the list here <https://gitlab.gnome.org/GNOME/Initiatives/issues/8> up to date, if you ever want to help by improving the situation of an old application and you have no idea where to start from, you can always send me an email or PM on Twitter or Matrix.
