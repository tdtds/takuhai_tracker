#
# Takuhai Tracker database manipulation tasks
#

namespace :docker do
	desc 'build docker image'
	task :build, :tag do |task, args|
		tag = args[:tag] || 'tdtds/takuhai-tracker-cron'
		sh "docker build -t #{tag} -f misc/docker/cron/Dockerfile ."
	end

	desc 'run cron docker image interactive'
	task :run, :tag, :name do |task, args|
		tag = args[:tag] || 'tdtds/takuhai-tracker-cron'
		name = args[:name] || 'takuhai-tracker-cron'
		sh "docker run -it --rm --name #{name} --env-file #{Dir.pwd}/.env #{tag}"
	end
end
