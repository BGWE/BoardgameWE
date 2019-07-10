.PHONY:  venv activate start_dev_env stop_dev_env start_testing_env stop_testing_env

start_dev_env: venv deploy_dev
	docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend build && docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend up -d --remove-orphans

stop_dev_env: 
	docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend stop ; docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend rm -f -v

start_testing_env: venv deploy_testing
	docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend_testing build && docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend_testing up -d --remove-orphans

stop_testing_env: 
	docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend_testing stop ; docker-compose -f tools/bgcinfra/docker-compose.yml -p bgwe_backend_testing rm -f -v

run_test:
	docker exec -it bgwe_backend_testapiserver_1 yarn run test

venv: 
	sh tools/bgcinfra/setup.sh -b

deploy_dev:
	( \
		source tools/bgcinfra/bgcvenv/bin/activate; \
		python tools/bgcinfra/bgcinfra.py deploy dev; \
	)

deploy_testing:
	( \
		source tools/bgcinfra/bgcvenv/bin/activate; \
		python tools/bgcinfra/bgcinfra.py deploy testing; \
	)

clean:
	rm -rf tools/bgcinfra/bgcvenv
	rm -f tools/bgcinfra/docker-compose.yml
