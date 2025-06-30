+++
title = "Grant the AI octopus access to a portion of your desktop"
date = 2025-06-30
draft = false

[taxonomies]
categories = ["Rust", "AI"]
tags = ["Rust"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = true
+++
The usage of Large Language Models (LLMs) has become quite popular, especially with publicly and *"freely"* accessible tools like ChatGPT, Google Gemini, and other models. They're now even accessible from the CLI, which makes them a bit more interesting for the nerdier among us.

One game-changer for LLMs is the development of the Model Context Protocol (MCP), which allows an external process to feed information (**resources**) to the model in real time. This could be your IDE, your browser, or even your desktop environment. It also enables the LLM to trigger predefined actions (**tools**) exposed by the MCP server. The protocol is basically JSON-RPC over socket communication, which makes it easy to implement in languages like Rust.

So, what could possibly go wrong if you gave portions of your desktop to this ever-growing AI octopus?

## The implementation details

Over the weekend, I decided not only to explore building an MCP server that integrates with the **GNOME** desktop environment, but also to use **Anthropic’s Claude Code** to help implement most of it.

### The joyful moments

The first step was to figure out what would be simple yet meaningful to give the LLM access to, to see:

* if it could recognize that an MCP server was feeding it live context, and
* how well it could write code around that, lol.

I started by exposing the list of installed applications on the system, along with the ability to launch them. That way, I could say something like: _"Start my work environment"_, and it would automatically open my favorite text editor, terminal emulator, and web browser.

Overall, the produced code was pretty okay; with some minor comments here and there, the model managed to fix its mistakes without any issues.

Once most of the basic tools and resources were in place, the LLM also did some nice code cleanups by writing a small macro to simplify the process of creating new tools/resources without code duplication.

### The less joyful ones

You know that exposing the list of installed applications on the system is not really the important piece of information the LLM would need to do anything meaningful. What about the list of your upcoming calendar events? Or tasks in your Todo list?

If you’re not familiar with GNOME, the way to achieve this is by using Evolution Data Server’s DBus APIs, which allow access to information like calendar events, tasks, and contacts. For this task, the LLM kept **hallucinating** DBus interfaces, inventing methods, and insisted on implementing them despite me repeatedly telling it to stop — so I had to take over and do the implementation myself.

My takeaway from this is that LLMs will always require human supervision to ensure what they do is actually what they were asked to do.

## Final product

The experience allowed us (me and the LLM pet) to build a simple yet powerful tool that can give your LLM access to the following resources:
- Applications list
- Audio and media status (MPRIS)
- Calendar events
- System information
- Todo list

And we built the following tools:
- Application launcher
- Audio and media control (MPRIS)
- Notifications, allowing sending a new notification
- Opening a file
- Quick settings, allowing the LLM to turn on/off things like dark style, Wi-Fi, or so
- Screenshot, useful for things like text recognition, for example, or even asking the LLM to judge your design skills
- Wallpaper, allows the LLM to set you a new wallpaper, because why not!
- Window management, allows listing, moving, and resizing windows using the **unsafe** GNOME Shell `Eval` API for now, until there is a better way to do it.

One could add more tools, for example, creating new events or new tasks, but I left the exercise to new contributors.

The tool is available on GitHub at <https://github.com/bilelmoussaoui/gnome-mcp-server> and is licensed under the MIT License.

### Caution

Giving an external LLM access to real-time information about your computer has privacy and potentially security implications, so use with caution. The built tool allows disabling specific tools/resources via a configuration file; see <https://github.com/bilelmoussaoui/gnome-mcp-server?tab=readme-ov-file#configuration>

## Conclusion

The experimentation was quite enriching as I learned how MCP can be integrated into an application/ecosystem and how well LLMs ingest those **resources** and make use of the exposed **actions**. Until further improvements are made, enjoy the little toy tool!
