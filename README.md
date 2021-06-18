# outbox-pattern
Outbox Patter microservices implementation

This repo holds a simple TODOS app with outbox pattern implementation publishing events to Kafka using MongoDB as storage

## How to setup 
- Setup a kubernetes in docker cluster in you local machine
- Deploy mongodb statefulset has a replicaset in order to support transactions, run this commands in order when every one is ready
  - `cd infra/mongo-sf`
  - `kubectl apply -f mongodb-statefulset.yml`
  - `kubectl exec -it pod/mongod-0 mongo`
  - copy paste commands from file run-cluster.js
  - `cd ../..`
- Run all deployments with skaffold
  - `skaffold dev`
- Monitor execution and enjoy
