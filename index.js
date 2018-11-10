const PluginError = require('plugin-error'),
    replaceExtension = require('replace-ext'),
    through = require('through2'),
    htmlparser = require("htmlparser2"),
    complier = require('./compiler'),
    path = require('path');

const regen = (options, sync) => through.obj((file, enc, cb) => { // eslint-disable-line consistent-return
    if (file.isNull()) {
        return cb(null, file);
    }

    if (file.isStream()) {
        return cb(new PluginError('regen', 'Currently streaming not supported'));
    }

    let css = new Map();
    
    try {
        const parser = new htmlparser.Parser({
            onopentag: (name, attribs) => {
                if (attribs.class) {

                    const classNames = attribs.class.split(' ');

                    classNames.forEach((name) => {
                        css.set(name, complier(name));
                    })
                }
            },
            onend: () => {
                file.contents = Buffer.from(Array.from(css.values()).join("\r\n")); // eslint-disable-line no-param-reassign
                file.path = replaceExtension(file.path, '.css'); // eslint-disable-line no-param-reassign

                cb(null, file);
            }
        });
        parser.write(file.contents.toString());
        parser.end();  
    } catch(error) {
        return cb(new PluginError('regen', error.message));
    }      
});

//////////////////////////////
// Log errors nicely
//////////////////////////////
regen.logError = function logError(error) {
    const message = new PluginError('regen', error.message).toString();
    process.stderr.write(`${message}\n`);
    this.emit('end');
};


module.exports = regen;