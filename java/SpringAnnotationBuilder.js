/* global define */

let CodeBuilder = require("../core/generator").CodeBuilder;
const SpringProfile = require("./JavaProfiles").SpringProfile;
const springProfile = new SpringProfile();

const springProcessor = {
    None: {
        getAnnotation() { return ""; },
        getImportStatement() { return ""; }
    },
    Component: {
        getAnnotation() { return "@Component"; },
        getImportStatement() { return "import org.springframework.stereotype.Component;"; }
    },
    Service: {
        getAnnotation() { return "@Service"; },
        getImportStatement() { return "import org.springframework.stereotype.Service;"; }
    },
    Configuration: {
        getAnnotation() { return "@Configuration"; },
        getImportStatement() { return "import org.springframework.context.annotation.Configuration;"; }
    },
    Repository: {
        getAnnotation() { return "@Repository"; },
        getImportStatement() { return "import org.springframework.stereotype.Repository;"; }
    },
    Controller: {
        getAnnotation() { return "@Controller"; },
        getImportStatement() { return "import org.springframework.stereotype.Controller;"; }
    },
    RestController: {
        getAnnotation() { return "@RestController"; },
        getImportStatement() { return "import org.springframework.web.bind.annotation.RestController;"; }
    }
};

const getAnnotation = (componentName, annotation) => {
    return annotation ?
        (componentName ? `${annotation}("${componentName}")` : annotation) :
        annotation;
};

class SpringAnnotationBuilder extends CodeBuilder {
    buildClass(umlClass) {
        const classFragment = umlClass.codeFragment;
        const processor = springProcessor[springProfile.get("componentKind", umlClass)];

        const componentName = springProfile.get("componentName", umlClass);

        const annotation = getAnnotation(componentName, processor.getAnnotation());
        const annotationImport = processor.getImportStatement();

        if (annotation) {
            umlClass.annotate(annotation);
        }

        if (annotationImport) {
            classFragment.addStandardImport(annotationImport);
        }
    }
}

exports.SpringAnnotationBuilder = SpringAnnotationBuilder;
