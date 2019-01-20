# docker image for takuhai tracker worker process driver

## build an image
```
% bundle exec rake docker:build[tag_of_image]
```

in default, the tag of image is 'tdtds/takuhai-tracker-worker'.

## run the container in interactive mode
```
% bundle exec rake docker:run[tag_of_image,name_of_container]
```

in default, the tag of image is 'tdtds/takuhai-tracker-worker',
and the name of container is 'takuhai-tracker-worker'.

