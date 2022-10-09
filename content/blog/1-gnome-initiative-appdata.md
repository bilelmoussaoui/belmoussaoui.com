+++
title = "GNOME Initiative: AppData update"
date = 2019-01-14
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

Hey everyone! Welcome to my first blog article on my brand new website. It has been a few months since I bought this domain name but I didn't have the opportunity to set a simple WordPress on it. I will try to keep it up to date and share various articles about stuff I love and enjoy during my free time.

## The GNOME/initiatives, what's it?

A small description from the Wiki page of the iniatives repository on GNOME's Gitlab instance: "Initiatives are cross-project goals that have wide acceptance inside the GNOME community as desired."

## What's the AppData update initiative?

It's an initiative that I have started the day after I joined the GNOME Foundation as a member and I have been working days before that. It aims to provide an up to date AppData file, which is a file shipped with the application to provide information about the application the user is going to install like the screenshots, a description of the application, release change log and other details.

Those files were in some "unmaintained" projects out of date, had old screenshots or maybe an old format of the AppData file that doesn't follow the new [FreeDesktop specifications](https://freedesktop.org/software/appstream/docs/chap-Quickstart.html). I started sending patches to fix those files on various of GNOME apps/games; I lost track of what I have already fixed and what still needs to be done, so I took the opportunity to start an initiative to provide up to date and validated AppData files.

## The Goals of the AppData update initiative

I have set three goals for each GNOME application:

- A unified application ID, which is basically the usage of the application ID as a filename for the AppData, Desktop, icons files shipped with the application itself. If we take Nautilus for example, it should ship an AppData file named `org.gnome.Nautilus.appdata.xml`, a desktop file named `org.gnome.Nautilus.desktop` and a bunch of icons prefixed by `org.gnome.Nautilus`.

- An up to date AppData file: the goal here is to make sure we provide all the information the user might need on the AppData file, like the URL to report issues, to donate to GNOME, the latest release of the application and other informative, yet useful for users. Which are shown later by GNOME Software or other alternatives?

- A validated AppData/Desktop files: The desktop file can be validated using a tool called `desktop-file-validate`, the same thing for the AppData file using `appstream-util`. The idea is to add two tests to the meson tests in order to always assure we are shipping a valid and up to date Desktop and AppData file.

## How things are going on so far?

As you can see in [AppData update initiative](https://gitlab.gnome.org/GNOME/Initiatives/issues/8) there's still a lot of work to be done, the list of application is not finished yet either. You can help by opening an issue or send a merge request to a project with an updated AppData file, tests to validate AppData/Desktop files or just pointing them out to me and will try to figure out some free time to deal with that.

If you want to help making better free and open source software a reality, start contributing now.