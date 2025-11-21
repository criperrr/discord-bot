#!/bin/bash

LOG_FOLDER="./logs"
if [[ ! -d $LOG_FOLDER ]]; then
    mkdir $LOG_FOLDER
fi
LOG_FILES=$(ls ./logs | wc -l)

if [ "$LOG_FILES" -gt 0 ]; then
	rm -rf ./logs/*
fi

# Mata qualquer processo do usuario que possa ser o bot (pro servidor da escola, isso serve)
PROCESS=$(ps u | awk '/eq5ini2a/ && /node/ && !/awk/{print $2}') # todos os processos do usuario -> pega so as linhas con 'node' -> remove o grep e pga a seguna coluna (pid)


if [ -n "$PROCESS" ]; then
    kill "$PROCESS" # só mata se a variavel process n for vazia (se o processo ja estiver rodando)
fi

read -p "Digite o email padrão do NSAC (pode deixar vazio): " nsacemail
read -s -p "Digite a senha do NSAC: " nsacpass

export NSACPASS="$nsacpass" 
export NSACEMAIL="$nsacemail"
nohup node index.js >> "./logs/log.txt" 2>&1 &
disown
