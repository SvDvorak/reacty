FROM node

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

COPY package.json package-lock.json $HOME/emoji-counter/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/emoji-counter
RUN npm install

USER root
COPY . $HOME/emoji-counter
RUN mkdir -p database
RUN chown -R app:app $HOME/*
USER app