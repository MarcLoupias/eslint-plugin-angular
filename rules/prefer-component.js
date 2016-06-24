/*
 * Since AngularJS 1.5, we can use a new API when creating directives.
 * This new API should be use when creating directive without DOM manipulation.
 *
 * @version 0.16.0
 * @category bestPractice
 * @sinceAngularVersion 1.5
 */
'use strict';

let angularRule = require('./utils/angular-rule');
const allowedProperties = ['compile', 'link', 'multiElement', 'priority', 'templateNamespace', 'terminal'];

module.exports = angularRule(function(context) {
    var potentialReplaceNodes = {};

    function addPotentialLinkNode(variableName, node) {
        let nodeList = potentialReplaceNodes[variableName] || [];

        nodeList.push({
            name: variableName,
            node: node,
            block: context.getScope().block.body
        });

        potentialReplaceNodes[variableName] = nodeList;
    }

    return {
        'angular:directive': function(callExpressionNode, fnNode) {
            if (!fnNode || !fnNode.body) {
                return;
            }
            fnNode.body.body.forEach(function(statement) {
                if (statement.type === 'ReturnStatement' && !potentialReplaceNodes[statement.argument.name || '']) {
                    context.report(statement, 'Directive should be implemented with the component method.');
                }
            });
        },
        AssignmentExpression: function(node) {
            // Only check for literal member property assignments.
            if (node.left.type !== 'MemberExpression') {
                return;
            }

            if (allowedProperties.indexOf(node.left.property.name) < 0) {
                return;
            }

            addPotentialLinkNode(node.left.object.name, node);
        },
        Property: function(node) {
            if(node.key.name === 'restrict'){
                if(node.value.raw.indexOf('C') < 0 && node.value.raw.indexOf('A') < 0){
                  return;
                }
            } else if (allowedProperties.indexOf(node.key.name) < 0) {
                return;
            }

            // assumption: Property always belongs to a ObjectExpression
            let objectExpressionParent = node.parent.parent;

            // add to potential link nodes if the object is defined in a variable
            if (objectExpressionParent.type === 'VariableDeclarator') {
                addPotentialLinkNode(objectExpressionParent.id.name, node);
            }

            // report directly if object is part of a return statement and inside a directive body
            if (objectExpressionParent.type === 'ReturnStatement') {
                addPotentialLinkNode('', node);
            }
        }
    };
});

module.exports.schema = [];
