const jss = require('jss').default;
const invariant = require('invariant');
const { rules, breakpoints } = require('./defaultConfig');

const createGenerateClassName = () => {
    return (rule, sheet) => `${rule.key}`
}

jss.setup({ createGenerateClassName });

const transformBreakpoint = breakpoint => {
    invariant(breakpoints[breakpoint], `Invalid breakpoint given - ${breakpoint}`);

    return `@media (min-width:${breakpoints[breakpoint]})`;
};

const transformRule = rule => {
    invariant(rules[rule], `Invalid rule given - ${rule}`);
    
    return rules[rule];
};

const transformType = type => (type === 'pe')? '%': type;

module.exports = (className) => {

    const validTypes = {'px':1, 'pe':1, 'em': 1, 'rem': 1};
    
    const regex = /(?:(?<breakpoint>[a-z]*):)?(?<rule>[a-z]*)-(?:(?<color>#(?:(?:[0-9a-fA-F]{2}){3}|(?:[0-9a-fA-F]){3}))|(?<value>\d+(?:\.\d+)?)?(?<type>[a-z]*))/g;
    const result = regex.exec(className);
    if(result === null) {
        invariant(false, `Invalid class given - ${className}`);
    }
    let { breakpoint, rule, value, type, color} = result.groups;

    if(color) {
        value = color;
    }

    if(!value) {
        value = type;
        type = null;
    }    

    invariant(rule, `No rule given for ${className}`);
    invariant(value, `Invalid or no value given for ${className}`);
    if(type) {
        invariant(validTypes[type], `Invalid type given for ${className}`);  
    }

    rule = transformRule(rule);
    type = transformType(type);

    let style = {
        [`${className}`]: {
            [`${rule}`]: `${value}${type?type:''}`
        }
    };
    
    let breakpointStyle = null;
    if(breakpoint) {
        breakpoint = transformBreakpoint(breakpoint);

        breakpointStyle = {
            [breakpoint]: style
        };
    }

    const sheet = jss.createStyleSheet(breakpointStyle || style)
    return sheet.toString();
};