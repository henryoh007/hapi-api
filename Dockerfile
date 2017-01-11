FROM python:2.7.10
MAINTAINER Kirsten Hunter (khunter@akamai.com)
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --force-yes -q curl python-all wget vim python-pip php-pear php5 php5-mongo php5-dev ruby ruby-dev perl5 npm 
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --force-yes mongodb-server mongodb-dev mongodb httpie
RUN curl -sL https://deb.nodesource.com/setup_4.x |  bash -
RUN apt-get install -y --force-yes nodejs
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
RUN apt-get update && apt-get install -y mongodb-org
RUN mkdir -p /data/db
ADD . /opt
WORKDIR /opt
RUN npm install
ADD ./MOTD /opt/MOTD
RUN echo "cat /opt/MOTD" >> /root/.bashrc
RUN echo "PS1='Hapi.js API Course >> '" >> /root/.bashrc
RUN echo "export NODE_PATH=/opt/node_modules" >> /root/.bashrc
ENTRYPOINT ["/bin/bash"]
