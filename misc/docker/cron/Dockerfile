#
# Dockerfile for Takuhai Tracker cron task
#
# need some ENVs:
#   MONGODB_URI
#
FROM ruby:2.5.0
MAINTAINER tdtds <t@tdtds.jp>

RUN apt update && apt install -y busybox-static
COPY ["misc/docker/cron/crontab", "/var/spool/cron/crontabs/root"]

RUN mkdir -p /opt/takuhai-tracker
COPY [".", "/opt/takuhai-tracker/"]

WORKDIR /opt/takuhai-tracker
RUN bundle --path=vendor/bundl --without=development:test --jobs=4 --retry=3

ENV RACK_ENV=production
ENV TZ=Asia/Tokyo
CMD ["busybox", "crond", "-L", "/dev/stderr", "-f"]
