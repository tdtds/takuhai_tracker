# docker image for takuhai tracker cron task driver

## build an image
```
% bundle exec rake docker:build[tag_of_image]
```

in default, the tag of image is 'tdtds/takuhai-tracker-cron'.

## run the container in interactive mode
```
% bundle exec rake docker:run[tag_of_image,name_of_container]
```

in default, the tag of image is 'tdtds/takuhai-tracker-cron',
and the name of container is 'takuhai-tracker-cron'.

