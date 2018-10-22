#
# Dockerfile for Takuhai Tracker cron task
#
# need some ENVs:
#   MONGODB_URI
#
FROM ruby:2.5
MAINTAINER tdtds <t@tdtds.jp>

RUN apt update && apt install -y busybox-static; mkdir -p /opt/takuhai-tracker
COPY ["misc/docker/cron/crontab", "/var/spool/cron/crontabs/root"]
COPY ["Gemfile", "Gemfile.lock", "/opt/takuhai-tracker/"]

WORKDIR /opt/takuhai-tracker
RUN bundle --path=vendor/bundle --without=development:test --jobs=4 --retry=3
COPY [".", "/opt/takuhai-tracker/"]

ENV RACK_ENV=production
ENV TZ=Asia/Tokyo
CMD ["busybox", "crond", "-L", "/dev/stderr", "-f"]
