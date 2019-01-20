#
# Takuhai Tracker database manipulation tasks
#

namespace :docker do
	desc 'build worker image'
	task :build, :tag do |task, args|
		tag = args[:tag] || 'tdtds/takuhai-tracker-worker'
		sh "sudo docker build -t #{tag} -f misc/docker/worker/Dockerfile ."
	end

	desc 'run worker interactive'
	task :run, :tag, :name do |task, args|
		tag = args[:tag] || 'tdtds/takuhai-tracker-worker'
		name = args[:name] || 'takuhai-tracker-worker'
		sh "sudo docker run -it --rm --name #{name} --env-file #{Dir.pwd}/.env #{tag}"
	end
end
