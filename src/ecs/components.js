// each factory returns a plain data object. the factory itself is used as
// the storage key, so there's no risk of string typos colliding.

export const Position = (x = 0, y = 0) => ({ x, y });
export const Velocity = (x = 0, y = 0) => ({ x, y });
export const Shape = (kind = 'circle', props = {}) => ({ kind, ...props });
export const Mass = (value = 1) => ({ value });
export const Material = (restitution = 0.5, friction = 0.3) => ({ restitution, friction });
