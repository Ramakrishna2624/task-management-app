"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const createValidationPipe = (options) => {
    return new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        ...options,
    });
};
exports.createValidationPipe = createValidationPipe;
//# sourceMappingURL=validation.pipe.js.map