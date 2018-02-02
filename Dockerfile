FROM node

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

COPY package.json package-lock.json $HOME/reacty/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/reacty
RUN npm install

USER root
COPY . $HOME/reacty
RUN mkdir -p database
RUN chown -R app:app $HOME/*
USER app