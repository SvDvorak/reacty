FROM node

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

# Skipped copying package-lock.json, cannot build sqlite3 with it
# I cannot explain why but after npm install the generated package-lock.json is identical to this one yet it still breaks if copied. No idea. Can't be bothered.
COPY package.json $HOME/reacty/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/reacty
RUN npm install --python=/usr/bin/python3

USER root
COPY . $HOME/reacty
RUN mkdir -p database
RUN chown -R app:app $HOME/*
USER app