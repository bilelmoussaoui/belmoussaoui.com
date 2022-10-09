+++
title = "Tick Tock Clocks got redesigned!"
date = 2020-02-23
draft = false

[taxonomies]
categories = ["GNOME"]
tags = ["GNOME"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

Few months back, I convinced Zander Brown to take over GNOME Clocks with me and we have been working hard to refresh the code base and give it a new look for GNOME 3.36.

So far, we have got all the four panels re-designed based on the mockups made by the GNOME design team.

![Alarms](/posts/9-tick-tock-clocks-got-redesigned/alarms-1.png)

![Alarms Setup](/posts/9-tick-tock-clocks-got-redesigned/alarm-setup.png)

![Stopwatch](/posts/9-tick-tock-clocks-got-redesigned/stopwatch-1.png)

![Timer](/posts/9-tick-tock-clocks-got-redesigned/timer.png)

![World](/posts/9-tick-tock-clocks-got-redesigned/world.png)

Of course, one major thing about the new design is that the application is fully adaptive now.

![Alarms Adaptive](/posts/9-tick-tock-clocks-got-redesigned/alarms-adaptive.png)

![Stopwatch Adaptive](/posts/9-tick-tock-clocks-got-redesigned/stopwatch-adaptive.png)

![Timer Adaptive](/posts/9-tick-tock-clocks-got-redesigned/timer-adaptive.png)

![World Adaptive](/posts/9-tick-tock-clocks-got-redesigned/world-adaptive.png)

The rest of the changes were basically code cleanup. It’s very satisfying to drop 500+ lines of dead code.

We have also added GNOME Clocks to the [newcomers projects](https://wiki.gnome.org/Newcomers/ChooseProject), you should be able to pick up Clocks from [GNOME Builder](https://flathub.org/apps/details/org.gnome.Builder) which will hopefully help us attract more contributors. Please reach us at #clocks:gnome.org on Matrix if you would like to get involved.

The re-design is on master now, if you have some time to give it a try and report back that would be awesome! It should hit gnome-nightly pretty soon!

PS: sorry for the last minute translation work