const fs = require("fs"),
    path = require("path");


const repositoryTemplate = fs.readFileSync(path.join(__dirname, "./templates/repository-template.java"), "utf-8");
const serviceTemplate = fs.readFileSync(path.join(__dirname, "./templates/service-template.java"), "utf-8");
const controllerTemplate = fs.readFileSync(path.join(__dirname, "./templates/controller-template.java"), "utf-8");

exports.repositoryTemplate = repositoryTemplate;
exports.serviceTemplate = serviceTemplate;
exports.controllerTemplate = controllerTemplate;