const jss = require('jss').default;
const nested = require('jss-nested').default;
const invariant = require('invariant');
const { rules, values, breakpoints, subs } = require('./defaultConfig');

const createGenerateClassName = () => {
    return (rule, sheet) => `${rule.key}`
}

jss.setup({ createGenerateClassName });
jss.use(nested());

const transformBreakpoint = breakpoint => {
    invariant(breakpoints[breakpoint], `Invalid breakpoint given - ${breakpoint}`);

    const points = breakpoints[breakpoint];

    if(typeof points == 'string') {
        return points;
    }

    if(Array.isArray(points)) {
        return `@media (min-width:${points[0]}px) and (max-width:${points[1]}px)`;        
    }

    return `@media (min-width:${points}px)`;
};

const transformRule = rule => {
    
    if(subs[rule]) {
        invariant(Array.isArray(subs[rule]), `Subs must be an array of rules given - ${rule}`);
        return subs[rule];
    }
    
    invariant(rules[rule], `Invalid rule given - ${rule}`);

    return rules[rule];
};

const transformValue = value => {    
    return values[value]?values[value]:value;
};

const transformType = type => (type === 'pe')? '%': type;

module.exports = (className, cb) => {

    const validTypes = {'px':1, 'pe':1, 'em': 1, 'rem': 1};
    
    const intialRegex = new RegExp(`(?:(?<breakpoint>(?:${Object.keys(breakpoints).join('|')})):)?(?:(?<state>[a-z]*):)?(?<rule>[a-z]*)-(?:(?<value>.*))`);
    const intialResult = intialRegex.exec(className);

    if(intialResult === null) {
        return cb(null); // Might be custom class
    }

    let { state, breakpoint, rule, value} = intialResult.groups;

    const valueRegex = /(?:(?<color>#(?:(?:[0-9a-fA-F]{2}){3}|(?:[0-9a-fA-F]){3}))|(?:(?<group_dig>(?:\d+(?:\.\d+)?)_(?:\d+(?:\.\d+)?))|(?<dig>\d+(?:\.\d+)?))(?<type>[a-z]+))|(?<str>^[a-zA-Z0-9()-_]+)/g;
    const valueResult = valueRegex.exec(value);

    let { str, dig, group_dig, color, type} = valueResult.groups;

    if(str) {
        str = str.replace('_', ' ');
    }
    
    if(group_dig) {
        group_dig = group_dig.replace('_', `${type} `);
    }

    value = color || str || dig || group_dig;

    invariant(rule, `No rule given for ${className}`);
    invariant(value, `Invalid or no value given for ${className}`);
    if(type) {
        invariant(validTypes[type], `Invalid type given for ${className}`);  
    }

    rule = transformRule(rule);
    value = transformValue(value);
    type = transformType(type);

    let propertyStyle = {};

    if(Array.isArray(rule)) {
        rule.forEach((name) => {
            propertyStyle[`${transformRule(name)}`] = `${value}${type?type:''}`;
        })
    } else {
         propertyStyle = {
            [`${rule}`]: `${value}${type?type:''}`
        };
    }  

    const stateStyle = {
        [`&:${state}`]: propertyStyle
    }

    const style = {
        [`${className}`]: state?stateStyle:propertyStyle
    };
    
    let breakpointStyle = null;
    if(breakpoint) {
        breakpoint = transformBreakpoint(breakpoint);

        breakpointStyle = {
            [breakpoint]: style
        };
    }

    const sheet = jss.createStyleSheet(breakpointStyle || style)
    return cb(sheet.toString());
};