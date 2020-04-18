#!/bin/sh
OPTIND=1

ENV_NAME="bgcvenv"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

output_dir=$SCRIPT_DIR
build=false
wait_apiserver=false

VENV_PATH="$output_dir/$ENV_NAME"

while getopts "w:bo:" opt; do
    case "$opt" in
    b)  build=true
        ;;
    w)  wait_apiserver=true
        host=$OPTARG
        ;;
    o)  output_dir=$OPTARG
        ;;
    esac
done

shift $((OPTIND-1))

[ "${1:-}" = "--" ] && shift

echo "===== Board Game Componion Setup Tool ====="

##############

if [ $build = true ]
then
    echo "Building environment..."

    if [ ! -d "$output_dir" ]; then
        echo "Directory ${output_dir} does not exist."
        exit 1
    fi

    ##############

    echo "Creating virutalenv ${ENV_NAME} in ${output_dir}..."
    if [ -d "$output_dir/$ENV_NAME" ]; then
        echo "Directory $output_dir/$ENV_NAME already exist."
        exit 0
    fi

    virtualenv --python=python3 "$output_dir/$ENV_NAME"


    echo "Activating environment..."
    source "${VENV_PATH}/bin/activate"

    echo "Installing packages..."
    pip3 install -r "${SCRIPT_DIR}/requirements.txt"

    echo "Exiting virtualenv..."
    deactivate
fi

##############


if [ $wait_apiserver = true ]
then
    echo "Waiting on API server... "
    status_code=$(curl --write-out %{http_code} --silent --head --fail http://${host})
    until [ $status_code -eq '401' ] ; do
        printf '.'
        sleep 4
        status_code=$(curl --write-out %{http_code} --silent --head --fail http://${host})
    done
    printf '\n'
    echo "API server is up ✅"
fi

