pipeline {
    agent {
    docker {
        image 'node:22-bookworm'
        args '--add-host=host.docker.internal:host-gateway'
    }
}

    stages {

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

        stage('Newman API Tests') {
            steps {
                sh 'npm install --no-save newman'
                sh 'npx newman run tests/postman/NexusTraffic.postman_collection.json --env-var BASE_URL=http://host.docker.internal:8000'
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