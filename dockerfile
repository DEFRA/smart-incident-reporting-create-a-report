FROM node:22.16-alpine3.22

LABEL author="DEFRA"
ARG GA_ID
ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /usr/src
COPY . create-a-report
WORKDIR /usr/src/create-a-report
RUN npm ci
RUN npm run build

EXPOSE $PORT

CMD [ "npm", "start" ]