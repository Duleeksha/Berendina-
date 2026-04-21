

export const usePhoneValidation = () => {
    const validatePhone = (value) => {
        if (!value) return "";
        
        // Sri Lankan Phone formats:
        // 1.10 digits starting with 0
        // 2.Starts with +94 followed by 9 digits
        const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;
        
        if (!phoneRegex.test(value)) {
            return "Invalid format (Ex: 0771234567 or +94771234567)";
        }
        
        return "";
    };

    return { validatePhone };
};
