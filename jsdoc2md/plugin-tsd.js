const isChainable = (doclet) => doclet && doclet.comment.indexOf("chainable") >= 0;
const isClassMember = ({kind}) => (kind === "member" || kind === "function");
const injected = (doclet) => (doclet.tags || []).filter(({title}) => title === "inject").map(({value}) => value.trim());

// const has = (doclet, tag) => doclet.comment.indexOf('@' + tag) >= 0

let tagLookup = {};
const matchLookup = (tag) => Object.keys(tagLookup)
    .sort(
        (a, b) => b.length - a.length
    )
    .filter(
        (lookup) => tag.indexOf(lookup) === 0
    );

const replaceNames = {};

module.exports.handlers = {
    parseBegin() {
        tagLookup = {};
    },
    newDoclet({doclet}) {

        if (doclet.memberof === "module:scramjet") {
            injected(doclet)
                .reduce(
                    (acc, symbol) => tagLookup[symbol] = doclet,
                    null
                ) && (doclet.undocumented = true);
        }

        if (tagLookup[doclet.longname]) {
            doclet.name = tagLookup[doclet.longname].name;
            doclet.memberof = tagLookup[doclet.longname].memberof;
            doclet.longname = tagLookup[doclet.longname].longname;
        }

        if (doclet.augments) {
            const oldAugments = doclet.augments;
            doclet.augments = oldAugments.map(
                augmented => matchLookup(augmented).map(
                    lookup => augmented.replace(lookup, tagLookup[lookup].longname)
                )
            );
            // if (replaced && doclet.kind === "class") {
            //     const oldName = doclet.name;
            //     doclet.name = `${oldName} extends ${oldAugments[0]}`;
            //     replaceNames[oldName] = doclet.name;
            // }
        }

        if (doclet.memberof) {
            matchLookup(doclet.memberof)
                .forEach(
                    (lookup) => {
                        doclet.longname = doclet.longname.replace(lookup, tagLookup[lookup].longname);
                        doclet.memberof = doclet.memberof.replace(lookup, tagLookup[lookup].longname);
                    }
                );
        }
        if (isClassMember(doclet)) {
            if (!doclet.returns && doclet.async) {
                doclet.returns = [{type: {names: ["Promise<any>"]}}];
            } else if (doclet.returns && doclet.async) {
                doclet.returns = doclet.returns.map(({type}) => {
                    return {type: {names: type.names.map(
                        name => name.startsWith("Promise<")
                            ? name
                            : `Promise<${name}>`
                    )}};
                });
            } else if (!doclet.returns && isChainable(doclet)) {
                doclet.returns = [{type: {names: ["this"]}}];
            }
        }
    },
    parseComplete({doclets}) {
        doclets.forEach(
            doclet => {
                const memberof = doclet.memberof;
                if (!memberof) return;

                const replacement = Object.entries(replaceNames).find(
                    ([key]) => {
                        const match = memberof.indexOf(key);

                        if (match === -1) return false;
                        if (match === 0) return true;
                        if (memberof[match - 1] === ".") return true;

                        return false;
                    }
                );

                if (replacement) {
                    doclet.memberof = doclet.memberof.replace(replacement[0], replacement[1]);
                }
            }
        );
    }
};

