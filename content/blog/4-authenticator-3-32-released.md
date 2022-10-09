+++
title = "Authenticator 3.32 released!"
date = 2019-05-22
draft = false

[taxonomies]
categories = ["GNOME", "Python", "Updates"]
tags = ["GNOME", "Python"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = true
+++

I have been planning to work a bit on [Authenticator](https://flathub.org/apps/details/com.github.bilelmoussaoui.Authenticator) and push a new release on Flathub for a while, it took a long time, the latest release was 0.2.5 released the 11 September 2018. I will be following the GNOME release schedule and versioning to make it easier for the users to track the latest release of Authenticator easily, that's why the release number bumped from 0.2.5 to 3.32.

## What's Authenticator?

Authenticator is a two-factor authentication application which basically generates a one time usage pin based on a unique token. It's made for GNOME using Python and GTK. The source code is available here <https://gitlab.gnome.org/World/Authenticator>

{{ figure(src="/posts/4-authenticator-3-32-released/screenshot3.png", caption="Authenticator - Main Window") }}


## What's new in this release?

I have worked mostly on re-factoring some parts of the code (still some work need to be done), but here's what we get for this new release:

- The possibility to lock your application with a password before having access to the accounts, the settings window, backup and restore functionalities

- GNOME Shell Search Provider: you can now type the account name or the provider of that account on your GNOME Shell Search bar and get the results of what's stored on Authenticator if the authentication with a password is disabled, you can then just click on the account and the PIN is copied to your clipboard

- We now fetch an icon for each provider you use by downloading the highest resolution favicon we can find on their website, if we can't find one, you can set an image or leave it empty

- Night Light: we now detect when the night light feature is enabled on your GNOME system and we switch automatically to a dark theme, you can enable that from the settings window

- The possibility to add an account for a provider (website/application) that's not available on our pre-shipped database

- A fancy new settings window

- Keyboard shortcuts

- A bunch of bug fixes

![Empty Window](/posts/4-authenticator-3-32-released/screenshot1.png)

![Main Window](/posts/4-authenticator-3-32-released/screenshot2.png)

![Add an account window](/posts/4-authenticator-3-32-released/screenshot3.png)

![Preferences](/posts/4-authenticator-3-32-released/screenshot4.png)

## Grab it now from Flathub

You can already download or update the application to the latest release from Flathub. If you are already a user of Authenticator, please back up your data, remove the current version and install the latest one, this is mostly due to the code refactoring I have done to make few things possible, you can restore your data later once the update is installed.

[Download from Flathub](https://flathub.org/apps/details/com.github.bilelmoussaoui.Authenticator)

### Authenticator Beta and Nightlies

Authenticator is also available on Flathub Beta to test the latest changes before they land on the stable release. You can install Authenticator from there using

```bash
flatpak install flathub-beta com.github.bilelmoussaoui.Authenticator
```

We also offer nightlies flatapk's which are built for each commit on our Gitlab repository.

## What are the plans for the next release?

You can find in our issues tracker the list of features we would like to implement, here's a small list of what you might expect in the next release

- Support for Steam Authenticator

- Support taking a photo of the QRCode

- Use Flatpak's Screenshot portal instead of GNOME shell's one

## How to contribute

You can help me improve Authenticator by either contributing code, here is a simple [contribution guideline](https://gitlab.gnome.org/World/Authenticator/blob/master/CONTRIBUTING.md). If you're a native English speaker, you can help us improve the wordings we are currently using, or you can help us translate Authenticator to your language [here](https://l10n.gnome.org/module/authenticator/).

List of useful links:

- Source code: <https://gitlab.gnome.org/World/Authenticator/>
- Translate Authenticator: <https://l10n.gnome.org/module/authenticator/>
- Matrix chatroom: <https://riot.im/app/#/room/#authenticator:matrix.org>
