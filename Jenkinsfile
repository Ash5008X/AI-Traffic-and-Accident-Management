pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Client Dependencies') {
            steps {
                dir('client') {
                    sh 'npm ci'
                }
            }
        }

        stage('Client Lint') {
            steps {
                dir('client') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Client Build') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }

        stage('Server Dependencies') {
            steps {
                dir('server') {
                    sh 'npm ci'
                }
            }
        }

        stage('Server Syntax Check') {
            steps {
                dir('server') {
                    sh 'node --check server.js'
                }
            }
        }
    }

    post {
        success {
            echo 'NexusTraffic CI pipeline completed successfully.'
        }

        failure {
            echo 'NexusTraffic CI pipeline failed.'
        }
    }
}
