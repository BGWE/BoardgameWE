#!/usr/bin/env python3

import argparse
import sys
import os
import jinja2
import yaml

class CliAPI(object):
    def __init__(self):
        self.parser = None
        self.args = None

        return super().__init__()        

    def has_cmd(self, cmd):
        return hasattr(self, cmd) 

    def execute(self):
        parser = argparse.ArgumentParser(
            description='Board Game Componion Infrastructure Tool',
            usage='bgcdinfra <command> [<args>]')

        parser.add_argument('command', help='Command to run')
        args = parser.parse_args(sys.argv[1:2])

        if not self.has_cmd(args.command):
            print('Unrecognized command')
            parser.print_help()
            exit(1)
        
        getattr(self, args.command)()

    def deploy(self):
        parser = argparse.ArgumentParser(
            description='Build BGC infra')
        # prefixing the argument with -- means it's optional
        parser.add_argument('environment')
        args = parser.parse_args(sys.argv[2:])
        print('Deploying environment: {0}'.format(args.environment)) 

        deployer = Deployer()
        deployer.build_docker_compose(args.environment)

class Deployer(object):
    SCRIPT_PATH                     = os.path.abspath(__file__)
    BGCINFRA_FOLDER_PATH            = os.path.dirname(SCRIPT_PATH)
    TEMPLATE_FOLDER_PATH            = os.path.join(BGCINFRA_FOLDER_PATH, 'template')
    BGCCONFIG_FOLDER_PATH           = os.path.join(BGCINFRA_FOLDER_PATH, 'configs')
    PROJECT_ROOT_FOLDER_PATH        = os.path.dirname(os.path.dirname(BGCINFRA_FOLDER_PATH))
    DOCKER_FOLDER_PATH              = os.path.join(PROJECT_ROOT_FOLDER_PATH, 'docker')
    OUTPUT_DOCKERCOMPOSE_FILE_PATH  = os.path.join(DOCKER_FOLDER_PATH, 'docker-compose.yml')


    def __init__(self):
        return super().__init__()

    def save_yaml_to_file(self, filepath, data):
        with open(filepath, 'w') as _f:
            yaml.dump(data, _f, default_flow_style=False)

    def build_docker_compose(self, environment):
        environment_values_filepath = '{0}.yml'.format(os.path.join(self.BGCCONFIG_FOLDER_PATH, environment))
        print('Loading environment values from {0}...'.format(environment_values_filepath))
        config_data = yaml.load(open(environment_values_filepath), Loader=yaml.SafeLoader)
        env = jinja2.Environment(loader = jinja2.FileSystemLoader(self.TEMPLATE_FOLDER_PATH), trim_blocks=True, lstrip_blocks=True)
        template = env.get_template('docker-compose.template.yml')
        
        print('Generating docker-compose.yml...')
        generated_config = template.render(config_data)
        try:
            self.save_yaml_to_file(self.OUTPUT_DOCKERCOMPOSE_FILE_PATH, generated_config)
        except Exception as e:
            print("Error while saving {0}".format(self.OUTPUT_DOCKERCOMPOSE_FILE_PATH))
            print(e)
            sys.exit(1)

        print('Configuration saved to {0}'.format(self.OUTPUT_DOCKERCOMPOSE_FILE_PATH))

if __name__ == "__main__":    
    cliApi = CliAPI()
    cliApi.execute()