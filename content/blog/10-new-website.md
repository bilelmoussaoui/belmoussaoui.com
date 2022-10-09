+++
title = "New Website!"
date = 2020-02-28
draft = false

[taxonomies]
categories = ["Web", "Python", "Updates"]
tags = ["Web", "Python"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

I have been thinking of writing a WordPress theme for the blog I had and I noticed that there were too many extensions, too many externally loaded files and trying to fix all of that would have taken me forever. I decided to take that as an opportunity to create something simple and nice with Django & React. 

## The Backend

Built with [Django REST Framework](https://www.django-rest-framework.org/) which makes providing a set of API endpoints pretty straightforward. These endpoints are mostly to fetch data from a PostgreSQL database or add/delete entries if a token is provided. The authentication is handled by [Knox](https://james1345.github.io/django-rest-knox/) & is used to provide a simple dashboard so I can manage the content I have on my blog.

## The Frontend

From configuring Webpack to produce what I want to write CSS, it was the most challenging part of the project. I ended up using [Bulma](https://bulma.io/) as a CSS framework which worked out pretty nicely! One thing I wanted to make sure of is to have the smallest bundle possible and avoid loading any external resources. I have replaced the externally loaded Google fonts with the [Inter Typeface](https://rsms.me/inter/) family ❤️ and distributed the JS into smaller chunks that are loaded only when used, bundled the few SVG icons I used instead of FontAwesome, removed the unused locales of moments.js and uglified the exported files. 

I will try to write soon about the technical challenges I had to deal with and hopefully, the new blog will help with that!

Until then, enjoy the new spyware-less blog and stay safe :)