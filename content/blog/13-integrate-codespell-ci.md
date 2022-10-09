+++
title = "Integrating codespell into your CI"
date = 2020-10-02
draft = false

[taxonomies]
categories = ["CI"]
tags = ["CI"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

If you have never heard of [codespell](https://github.com/codespell-project/codespell), it's a command line utility to check for common misspellings with the possibility to add your own dictionaries. I have looked lately at integrating it as part of the CI for some of my projects. 

# Gitlab CI

Currently codespell doesn't provide a docker image that could be used for CI. You can create your own or use a pretty simple [image](https://hub.docker.com/r/bilelmoussaoui/codespell) I have setup and pushed to <https://hub.docker.com>. 

The docker image is a simple as 

```dockerfile
FROM python:3.8

RUN pip3 install codespell

Once you have an image up and ready, you can add it to your .gitlab-ci.yml

codespell:
  image: "docker.io/bilelmoussaoui/codespell"
  script:
    - codespell -S "*.png,*.po,.git,*.jpg" -f
```

`-S` argument is a comma separated glob pattern, directories or files to ignore. The `-f` argument makes codespell check the file names as well.

You can find more about the possible options you can pass by running `codepsell --help`

# Github Actions

Codespell provides a [Github Action](https://github.com/codespell-project/actions-codespell) so integrating it as a workflow should be straightforward 

```yaml
on:
  push:
    branches: [master]
  pull_request:

name: Spell Check

jobs:
  codespell:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: codespell-project/actions-codespell@master
        with:
          check_filenames: true
```

See the [list of arguments](https://github.com/codespell-project/actions-codespell/blob/master/action.yml#L5) you can pass to the action.

[By default](https://github.com/codespell-project/codespell/blob/master/codespell_lib/_codespell.py#L53) codespell uses two dictionaries "clear" and "rare". You can tweak [that list](https://github.com/codespell-project/codespell/blob/master/codespell_lib/_codespell.py#L41-L52) to use something else by passing `--builtin "clear,usage,code"`.