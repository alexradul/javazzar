/**
* This module contains chain of classes that do association processing.
* Actually, this module contains AssociationProcessors organized using design pattern 'Chain of Responsibility'.
*/

class AssociationProcessor {
    /**
       * Constructs AssociationProcessor.
       * This is a Chain of Responsibility pattern, used to process associations between UML classes.
       */
    constructor(successor) {
        this.successor = successor;
    }
    /**
   * 'abstract' method, used to check whether this particular processing object ( a link in the chain)
   * is suitable for processing this particular association.
   * @param {type.UMLAssociationEnd} myAssociationEnd association end belonging to the current class (its member)
   * @param {type.UMLAssociationEnd} otherAssociationEnd other association end
   * @return {boolean} Returns true if processing object is responsible for this particular context, false otherwise
   */
    isMatchingContext() {
        return false;
    }
    /**
 * Implements code generation. Creates association fields, getters and setters, as well as link and unlink methods.
 */
    generateCode() { }

    process(builder, association, myAssociationEnd, otherAssociationEnd) {
        let successor = this.successor;
        if (this.isMatchingContext(myAssociationEnd, otherAssociationEnd)) {
            this.generateCode(builder, association, myAssociationEnd, otherAssociationEnd);
        } else if (successor) {
            successor.process(builder, association, myAssociationEnd, otherAssociationEnd);
        } else {
            throw (`No processing object found to process association ${association.name} between classes ${otherAssociationEnd.reference.name} and ${myAssociationEnd.reference.name}`);
        }
    }
}

class BiAssociation1_1 extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;
        if (myAssociationEnd.isNavigable() && otherAssociationEnd.isNavigable()) {
            if (myAssociationEnd.isZeroOrOneMultiplicity() && otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildOneToOne(association, myAssociationEnd, otherAssociationEnd);
    }
}

class BiAssociation1_N extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && otherAssociationEnd.isNavigable()) {
            if (otherAssociationEnd.isZeroOrOneMultiplicity() && !myAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildOneToMany(association, myAssociationEnd, otherAssociationEnd);
    }
}

class BiAssociationN_1 extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && otherAssociationEnd.isNavigable()) {
            if (myAssociationEnd.isZeroOrOneMultiplicity() && !otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildManyToOne(association, myAssociationEnd, otherAssociationEnd);
    }
}

class BiAssociationN_N extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && otherAssociationEnd.isNavigable()) {
            if (!otherAssociationEnd.isZeroOrOneMultiplicity() && !myAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildManyToMany(association, myAssociationEnd, otherAssociationEnd);
    }
}

class DirectedAssociation_1_1 extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && !otherAssociationEnd.isNavigable()) {
            if (myAssociationEnd.isZeroOrOneMultiplicity() && otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildOneToOneDirected(association, myAssociationEnd, otherAssociationEnd);
    }
}

class DirectedAssociation_N_1 extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && !otherAssociationEnd.isNavigable()) {
            if (myAssociationEnd.isZeroOrOneMultiplicity() && !otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildManyToOneDirected(association, myAssociationEnd, otherAssociationEnd);
    }
}

class DirectedAssociation_1_N extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && !otherAssociationEnd.isNavigable()) {
            if (!myAssociationEnd.isZeroOrOneMultiplicity() && otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildOneToManyDirected(association, myAssociationEnd, otherAssociationEnd);
    }
}

class DirectedAssociation_N_N extends AssociationProcessor {
    constructor(successor) {
        super(successor);
    }
    isMatchingContext(myAssociationEnd, otherAssociationEnd) {
        let isMatching = false;

        if (myAssociationEnd.isNavigable() && !otherAssociationEnd.isNavigable()) {
            if (!myAssociationEnd.isZeroOrOneMultiplicity() && !otherAssociationEnd.isZeroOrOneMultiplicity()) {
                isMatching = true;
            }
        }
        return isMatching;
    }
    generateCode(builder, association, myAssociationEnd, otherAssociationEnd) {
        builder.buildManyToManyDirected(association, myAssociationEnd, otherAssociationEnd);
    }
}

let associationProcessingChain =
    new BiAssociation1_1(
        new BiAssociation1_N(
            new BiAssociationN_1(
                new BiAssociationN_N(
                    new DirectedAssociation_1_1(
                        new DirectedAssociation_N_1(
                            new DirectedAssociation_1_N(
                                new DirectedAssociation_N_N(null))))))));

exports.associationProcessingChain = associationProcessingChain;
