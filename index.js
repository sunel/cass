const PluginError = require('plugin-error'),
    replaceExtension = require('replace-ext'),
    through = require('through2'),
    htmlparser = require("htmlparser2"),
    complier = require('./compiler'),
    path = require('path');

const cass = (options) => through.obj((file, enc, cb) => { // eslint-disable-line consistent-return
    if (file.isNull()) {
        return cb(null, file);
    }

    if (file.isStream()) {
        return cb(new PluginError('cass', 'Currently streaming not supported'));
    }

    let css = new Map();
    
    try {
        const parser = new htmlparser.Parser({
            onopentag: (name, attribs) => {
                if (attribs.class) {

                    const classNames = attribs.class.split(' ');

                    classNames.forEach((name) => {
                        complier(name, (style) => {
                            if(style !== null) {
                                css.set(name, style);
                            }                            
                        });                        
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
        return cb(new PluginError('cass', error.message));
    }      
});

//////////////////////////////
// Log errors nicely
//////////////////////////////
cass.logError = function logError(error) {
    const message = new PluginError('cass', error.message).toString();
    process.stderr.write(`${message}\n`);
    this.emit('end');
};


module.exports = cass;