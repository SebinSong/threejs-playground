// reference: https://spicyyoghurt.com/tools/easing-functions
export default function easeFunctionFactory ({
  type = 'linear',
  duration = 1,
  start = 0,
  end = 1
}) {
  const [b, c, d] = [start, end - start, duration]

  switch (type) {
    case 'quadIn':
      return t => b + c * (t /= d) * t
    case 'quadOut':
      return t => b + -1 * c * (t /= d) * (t - 2)
    case 'quadInOut': 
      return t => {
        if ((t /= d / 2) < 1)
          return c / 2 * t * t + b;
        
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
      }
    case 'sineIn':
      return t => -c * Math.cos(t / d * (Math.PI / 2)) + c + b
    case 'sineOut':
      return t => c * Math.sin(t / d * (Math.PI / 2)) + b
    case 'sineInOut':
      return t => -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b
    case 'expoIn':
      return t => (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b
    case 'expoOut':
      return t => (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b
    case 'expoInOut':
      return t => {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;

        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
      }
    case 'circularIn':
      return t => -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b
    case 'circularOut':
      return t => c * Math.sqrt(1 - (t = t / d - 1) * t) + b
    case 'circularInOut':
      return t => {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b
        
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b
      }
    case 'cubicIn':
      return t => c * (t /= d) * t * t + b
    case 'cubicOut':
      return t => c * ((t = t / d - 1) * t * t + 1) + b
    case 'cubicInOut':
      return t => {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b
    
        return c / 2 * ((t -= 2) * t * t + 2) + b
      }
    case 'elasticIn':
      return t => {
        let s = 1.70158, p = 0, a = c;

        if (t == 0) 
          return b;
        if ((t /= d) == 1)
          return b + c;

        if (!p) 
          p = d * .3;
        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }
  
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      }
    case 'elasticOut':
      return t => {
        let s = 1.70158, p = 0, a = c;

        if (t == 0) 
          return b;
        if ((t /= d) == 1) 
          return b + c;
        
        if (!p) 
          p = d * .3;
        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }

        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
      }
    case 'elasticInOut':
      t => {
        let s = 1.70158, p = 0, a = c;

        if (t == 0) 
          return b;
        if ((t /= d / 2) == 2) 
          return b + c;
        
        if (!p) 
          p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else { 
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }

        if (t < 1) 
          return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        
          return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
      }
    case 'backIn':
      return t => {
        const s = 1.70158;

        return c * (t /= d) * t * ((s + 1) * t - s) + b;
      }
    case 'backOut':
      return t => {
        const s = 1.70158;

        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
      }
    case 'backInOut':
      return t => {
        const s = 1.70158;

        if ((t /= d / 2) < 1) 
          return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
      }
    case 'linear':
    default:
      return t => b + c * t / d
  }
}