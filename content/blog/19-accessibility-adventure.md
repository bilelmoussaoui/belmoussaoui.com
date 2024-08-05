+++
title = "Accessibility Adventure"
date = 2024-08-05
draft = false

[taxonomies]
categories = ["Graphics"]
tags = ["Compositor", "GNOME"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

As part of my effort to [reduce Mutter dependencies](../18-reducing-mutter-dependencies/), I finally found some time to focus on removing Cairo now that we can have a Wayland only build. Since the majority of the remaining usages are related to fonts, we would need to move `CoglPango` to be part of GNOME Shell's `libst`.

## Merging Cally

Moving `CoglPango` also necessitates moving `ClutterText` and its corresponding accessibility implementation object, `CallyText`. The accessibility implementation is an object that inherits from `AtkObject` and can implement various interfaces to describe the type it corresponds to.

Inside Mutter, you would find the following types

- `ClutterActor` -> `CallyActor` implements `AtkComponent`
- `ClutterClone` -> `CallyClone` implements `AtkComponent`
- `ClutterStage` -> `CallyStage` implements `AtkComponent`, `AtkWindow`
- `ClutterStageManager` -> `CallyRoot` corresponds to the `Atk.Role.APPLICATION`
- `ClutterText` -> `CallyText` implements `AtkAction`, `AtkComponent`, `AtkEditableText`, `AtkText`

Once you initialize accessibility inside Mutter, the first step is to set up the `AtkUtil` implementation, which overrides the `get_root` and returns a `CallyRoot` instance. The remaining types register an `AtkObjectFactory` using the provided macros.

```c
CALLY_ACCESSIBLE_FACTORY (CALLY_TYPE_ACTOR, cally_actor, cally_actor_new);
CALLY_ACTOR_SET_FACTORY (CLUTTER_TYPE_ACTOR, cally_actor);
```

Allowing `Atk` to know which type to instantiate in case it encounters a `CLUTTER_TYPE_CLONE`, for example. That usually happens when you call `atk_gobject_accessible_for_object(actor)`, which creates an instance of `CallyActor` using `cally_actor_new`. Although, the factories are nice, they don't allow out-of-tree `AtkObject` implementations. But wait, <i>how is GNOME Shell accessible then</i>?

Inside GNOME Shell `StWidget`, the widget abstraction, overrides the `ClutterActorClass.get_accessible` virtual function and replaces the default behavior that would call `atk_gobject_accessible_for_object` to:

- Getting the corresponding accessibility type `GType` from another `StWidgetClass.get_accessible_type` virtual function
- Create an instance of that type using `g_object_new (T->get_accessible_type())`
- Call `atk_object_initialize` on it
- Keep a weak reference to it

After "upstreaming" both `StWidgetClass.get_accessible_type` and their override of `ClutterActorClass.get_accessible` to become the default behavior, I managed to completely get rid of the factories.  The remainder of the migration was mostly renaming things and trying to emit accessibility state changes when the `Clutter` type updated its state where possible.

<b>The patches are available at</b>:

- Mutter <https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/3917>
- GNOME Shell <https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3433>

## Testing Accessibility

Now that my branches of Mutter and GNOME Shell are working, I decided to test whether the reshuffling I did has caused any regressions. Unfortunately, `Accerciser` from the Fedora Rawhide repositories doesn't start due to a Python forward compatibility issue.

I remembered that [Georges Basile Stavracas Neto](https://gitlab.gnome.org/feaneron) started a re-implementation in C, called [Elevado](https://gitlab.gnome.org/feaneron/elevado), so between fixing `Accerciser` or adding some missing features I wanted in `Elevado`, the choice was easy.

{{ figure(src="/posts/19-accessibility-adventure/before.png", caption="Current accessibility tree") }}

And few hours later, I had managed to add some meaningful accessible names to various objects.

{{ figure(src="/posts/19-accessibility-adventure/after.png", caption="Accessibility tree from local development") }}

Now that I have confirmed that my changes didn't break any obvious thing, my weekend fun is over.
