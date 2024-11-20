FROM node:18-alpine

LABEL author="DEFRA"
ARG GA_ID
ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /usr/src
COPY . create-a-report
WORKDIR /usr/src/create-a-report
RUN npm ci

EXPOSE $PORT

CMD [ "npm", "start" ]