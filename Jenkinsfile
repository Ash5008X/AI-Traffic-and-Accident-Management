pipeline {
    agent {
    docker {
        image 'nexustraffic-ci-agent:26'
        args '--add-host=host.docker.internal:host-gateway'
    }
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
        stage('Docker Build') {
            steps {
                withCredentials([
                    string(credentialsId: 'nexus-mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'nexus-jwt-secret', variable: 'JWT_SECRET')
                ]) {
                    sh 'docker compose build'
                }
            }
        }

        stage('Start Application') {
            steps {
                withCredentials([
                    string(credentialsId: 'nexus-mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'nexus-jwt-secret', variable: 'JWT_SECRET')
                ]) {
                    sh 'docker compose up -d'
                }
            }
        }

        stage('Wait for Application') {
            steps {
                sh '''
                    echo "Waiting for NexusTraffic..."

                    for i in $(seq 1 30); do
                        if curl -fsS http://host.docker.internal:8000 > /dev/null; then
                            echo "Frontend is ready."
                            exit 0
                        fi

                        echo "Waiting... ($i/30)"
                        sleep 2
                    done

                    echo "Application did not become ready."
                    exit 1
                '''
            }
        }

        stage('Newman API Tests') {
            steps {
                sh 'npm install --no-save newman'
                sh 'npx newman run tests/postman/NexusTraffic.postman_collection.json --env-var BASE_URL=http://host.docker.internal:8000'
            }
        }
    post {
    always {
        withCredentials([
            string(credentialsId: 'nexus-mongo-uri', variable: 'MONGO_URI'),
            string(credentialsId: 'nexus-jwt-secret', variable: 'JWT_SECRET')
        ]) {
            sh 'docker compose down || true'
        }
    }

    success {
        echo 'NexusTraffic CI pipeline completed successfully.'
    }

    failure {
        echo 'NexusTraffic CI pipeline failed.'
    }
}git 