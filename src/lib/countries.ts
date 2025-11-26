export interface Country {
    code: string;
    name: string;
    nameRu: string;
    phoneCode: string;
    phoneLength: number; // Expected phone number length (without country code)
}

export const countries: Country[] = [
    { code: "AF", name: "Afghanistan", nameRu: "Афганистан", phoneCode: "+93", phoneLength: 9 },
    { code: "AL", name: "Albania", nameRu: "Албания", phoneCode: "+355", phoneLength: 9 },
    { code: "DZ", name: "Algeria", nameRu: "Алжир", phoneCode: "+213", phoneLength: 9 },
    { code: "AD", name: "Andorra", nameRu: "Андорра", phoneCode: "+376", phoneLength: 6 },
    { code: "AO", name: "Angola", nameRu: "Ангола", phoneCode: "+244", phoneLength: 9 },
    { code: "AR", name: "Argentina", nameRu: "Аргентина", phoneCode: "+54", phoneLength: 10 },
    { code: "AM", name: "Armenia", nameRu: "Армения", phoneCode: "+374", phoneLength: 8 },
    { code: "AU", name: "Australia", nameRu: "Австралия", phoneCode: "+61", phoneLength: 9 },
    { code: "AT", name: "Austria", nameRu: "Австрия", phoneCode: "+43", phoneLength: 10 },
    { code: "AZ", name: "Azerbaijan", nameRu: "Азербайджан", phoneCode: "+994", phoneLength: 9 },
    { code: "BS", name: "Bahamas", nameRu: "Багамы", phoneCode: "+1242", phoneLength: 7 },
    { code: "BH", name: "Bahrain", nameRu: "Бахрейн", phoneCode: "+973", phoneLength: 8 },
    { code: "BD", name: "Bangladesh", nameRu: "Бангладеш", phoneCode: "+880", phoneLength: 10 },
    { code: "BY", name: "Belarus", nameRu: "Беларусь", phoneCode: "+375", phoneLength: 9 },
    { code: "BE", name: "Belgium", nameRu: "Бельгия", phoneCode: "+32", phoneLength: 9 },
    { code: "BZ", name: "Belize", nameRu: "Белиз", phoneCode: "+501", phoneLength: 7 },
    { code: "BO", name: "Bolivia", nameRu: "Боливия", phoneCode: "+591", phoneLength: 8 },
    { code: "BA", name: "Bosnia and Herzegovina", nameRu: "Босния и Герцеговина", phoneCode: "+387", phoneLength: 8 },
    { code: "BR", name: "Brazil", nameRu: "Бразилия", phoneCode: "+55", phoneLength: 11 },
    { code: "BG", name: "Bulgaria", nameRu: "Болгария", phoneCode: "+359", phoneLength: 9 },
    { code: "KH", name: "Cambodia", nameRu: "Камбоджа", phoneCode: "+855", phoneLength: 9 },
    { code: "CA", name: "Canada", nameRu: "Канада", phoneCode: "+1", phoneLength: 10 },
    { code: "CL", name: "Chile", nameRu: "Чили", phoneCode: "+56", phoneLength: 9 },
    { code: "CN", name: "China", nameRu: "Китай", phoneCode: "+86", phoneLength: 11 },
    { code: "CO", name: "Colombia", nameRu: "Колумбия", phoneCode: "+57", phoneLength: 10 },
    { code: "CR", name: "Costa Rica", nameRu: "Коста-Рика", phoneCode: "+506", phoneLength: 8 },
    { code: "HR", name: "Croatia", nameRu: "Хорватия", phoneCode: "+385", phoneLength: 9 },
    { code: "CU", name: "Cuba", nameRu: "Куба", phoneCode: "+53", phoneLength: 8 },
    { code: "CY", name: "Cyprus", nameRu: "Кипр", phoneCode: "+357", phoneLength: 8 },
    { code: "CZ", name: "Czech Republic", nameRu: "Чехия", phoneCode: "+420", phoneLength: 9 },
    { code: "DK", name: "Denmark", nameRu: "Дания", phoneCode: "+45", phoneLength: 8 },
    { code: "DO", name: "Dominican Republic", nameRu: "Доминиканская Республика", phoneCode: "+1809", phoneLength: 7 },
    { code: "EC", name: "Ecuador", nameRu: "Эквадор", phoneCode: "+593", phoneLength: 9 },
    { code: "EG", name: "Egypt", nameRu: "Египет", phoneCode: "+20", phoneLength: 10 },
    { code: "SV", name: "El Salvador", nameRu: "Сальвадор", phoneCode: "+503", phoneLength: 8 },
    { code: "EE", name: "Estonia", nameRu: "Эстония", phoneCode: "+372", phoneLength: 7 },
    { code: "FI", name: "Finland", nameRu: "Финляндия", phoneCode: "+358", phoneLength: 9 },
    { code: "FR", name: "France", nameRu: "Франция", phoneCode: "+33", phoneLength: 9 },
    { code: "GE", name: "Georgia", nameRu: "Грузия", phoneCode: "+995", phoneLength: 9 },
    { code: "DE", name: "Germany", nameRu: "Германия", phoneCode: "+49", phoneLength: 10 },
    { code: "GR", name: "Greece", nameRu: "Греция", phoneCode: "+30", phoneLength: 10 },
    { code: "GT", name: "Guatemala", nameRu: "Гватемала", phoneCode: "+502", phoneLength: 8 },
    { code: "HN", name: "Honduras", nameRu: "Гондурас", phoneCode: "+504", phoneLength: 8 },
    { code: "HK", name: "Hong Kong", nameRu: "Гонконг", phoneCode: "+852", phoneLength: 8 },
    { code: "HU", name: "Hungary", nameRu: "Венгрия", phoneCode: "+36", phoneLength: 9 },
    { code: "IS", name: "Iceland", nameRu: "Исландия", phoneCode: "+354", phoneLength: 7 },
    { code: "IN", name: "India", nameRu: "Индия", phoneCode: "+91", phoneLength: 10 },
    { code: "ID", name: "Indonesia", nameRu: "Индонезия", phoneCode: "+62", phoneLength: 10 },
    { code: "IR", name: "Iran", nameRu: "Иран", phoneCode: "+98", phoneLength: 10 },
    { code: "IQ", name: "Iraq", nameRu: "Ирак", phoneCode: "+964", phoneLength: 10 },
    { code: "IE", name: "Ireland", nameRu: "Ирландия", phoneCode: "+353", phoneLength: 9 },
    { code: "IL", name: "Israel", nameRu: "Израиль", phoneCode: "+972", phoneLength: 9 },
    { code: "IT", name: "Italy", nameRu: "Италия", phoneCode: "+39", phoneLength: 10 },
    { code: "JP", name: "Japan", nameRu: "Япония", phoneCode: "+81", phoneLength: 10 },
    { code: "JO", name: "Jordan", nameRu: "Иордания", phoneCode: "+962", phoneLength: 9 },
    { code: "KZ", name: "Kazakhstan", nameRu: "Казахстан", phoneCode: "+7", phoneLength: 10 },
    { code: "KE", name: "Kenya", nameRu: "Кения", phoneCode: "+254", phoneLength: 10 },
    { code: "KW", name: "Kuwait", nameRu: "Кувейт", phoneCode: "+965", phoneLength: 8 },
    { code: "KG", name: "Kyrgyzstan", nameRu: "Кыргызстан", phoneCode: "+996", phoneLength: 9 },
    { code: "LV", name: "Latvia", nameRu: "Латвия", phoneCode: "+371", phoneLength: 8 },
    { code: "LB", name: "Lebanon", nameRu: "Ливан", phoneCode: "+961", phoneLength: 8 },
    { code: "LT", name: "Lithuania", nameRu: "Литва", phoneCode: "+370", phoneLength: 8 },
    { code: "LU", name: "Luxembourg", nameRu: "Люксембург", phoneCode: "+352", phoneLength: 9 },
    { code: "MY", name: "Malaysia", nameRu: "Малайзия", phoneCode: "+60", phoneLength: 9 },
    { code: "MV", name: "Maldives", nameRu: "Мальдивы", phoneCode: "+960", phoneLength: 7 },
    { code: "MX", name: "Mexico", nameRu: "Мексика", phoneCode: "+52", phoneLength: 10 },
    { code: "MD", name: "Moldova", nameRu: "Молдова", phoneCode: "+373", phoneLength: 8 },
    { code: "MC", name: "Monaco", nameRu: "Монако", phoneCode: "+377", phoneLength: 8 },
    { code: "MN", name: "Mongolia", nameRu: "Монголия", phoneCode: "+976", phoneLength: 8 },
    { code: "ME", name: "Montenegro", nameRu: "Черногория", phoneCode: "+382", phoneLength: 8 },
    { code: "MA", name: "Morocco", nameRu: "Марокко", phoneCode: "+212", phoneLength: 9 },
    { code: "NL", name: "Netherlands", nameRu: "Нидерланды", phoneCode: "+31", phoneLength: 9 },
    { code: "NZ", name: "New Zealand", nameRu: "Новая Зеландия", phoneCode: "+64", phoneLength: 9 },
    { code: "NG", name: "Nigeria", nameRu: "Нигерия", phoneCode: "+234", phoneLength: 10 },
    { code: "NO", name: "Norway", nameRu: "Норвегия", phoneCode: "+47", phoneLength: 8 },
    { code: "PK", name: "Pakistan", nameRu: "Пакистан", phoneCode: "+92", phoneLength: 10 },
    { code: "PA", name: "Panama", nameRu: "Панама", phoneCode: "+507", phoneLength: 8 },
    { code: "PY", name: "Paraguay", nameRu: "Парагвай", phoneCode: "+595", phoneLength: 9 },
    { code: "PE", name: "Peru", nameRu: "Перу", phoneCode: "+51", phoneLength: 9 },
    { code: "PH", name: "Philippines", nameRu: "Филиппины", phoneCode: "+63", phoneLength: 10 },
    { code: "PL", name: "Poland", nameRu: "Польша", phoneCode: "+48", phoneLength: 9 },
    { code: "PT", name: "Portugal", nameRu: "Португалия", phoneCode: "+351", phoneLength: 9 },
    { code: "QA", name: "Qatar", nameRu: "Катар", phoneCode: "+974", phoneLength: 8 },
    { code: "RO", name: "Romania", nameRu: "Румыния", phoneCode: "+40", phoneLength: 10 },
    { code: "RU", name: "Russia", nameRu: "Россия", phoneCode: "+7", phoneLength: 10 },
    { code: "SA", name: "Saudi Arabia", nameRu: "Саудовская Аравия", phoneCode: "+966", phoneLength: 9 },
    { code: "RS", name: "Serbia", nameRu: "Сербия", phoneCode: "+381", phoneLength: 9 },
    { code: "SG", name: "Singapore", nameRu: "Сингапур", phoneCode: "+65", phoneLength: 8 },
    { code: "SK", name: "Slovakia", nameRu: "Словакия", phoneCode: "+421", phoneLength: 9 },
    { code: "SI", name: "Slovenia", nameRu: "Словения", phoneCode: "+386", phoneLength: 8 },
    { code: "ZA", name: "South Africa", nameRu: "ЮАР", phoneCode: "+27", phoneLength: 9 },
    { code: "KR", name: "South Korea", nameRu: "Южная Корея", phoneCode: "+82", phoneLength: 10 },
    { code: "ES", name: "Spain", nameRu: "Испания", phoneCode: "+34", phoneLength: 9 },
    { code: "LK", name: "Sri Lanka", nameRu: "Шри-Ланка", phoneCode: "+94", phoneLength: 9 },
    { code: "SE", name: "Sweden", nameRu: "Швеция", phoneCode: "+46", phoneLength: 9 },
    { code: "CH", name: "Switzerland", nameRu: "Швейцария", phoneCode: "+41", phoneLength: 9 },
    { code: "TW", name: "Taiwan", nameRu: "Тайвань", phoneCode: "+886", phoneLength: 9 },
    { code: "TJ", name: "Tajikistan", nameRu: "Таджикистан", phoneCode: "+992", phoneLength: 9 },
    { code: "TH", name: "Thailand", nameRu: "Таиланд", phoneCode: "+66", phoneLength: 9 },
    { code: "TN", name: "Tunisia", nameRu: "Тунис", phoneCode: "+216", phoneLength: 8 },
    { code: "TR", name: "Turkey", nameRu: "Турция", phoneCode: "+90", phoneLength: 10 },
    { code: "TM", name: "Turkmenistan", nameRu: "Туркменистан", phoneCode: "+993", phoneLength: 8 },
    { code: "UA", name: "Ukraine", nameRu: "Украина", phoneCode: "+380", phoneLength: 9 },
    { code: "AE", name: "United Arab Emirates", nameRu: "ОАЭ", phoneCode: "+971", phoneLength: 9 },
    { code: "GB", name: "United Kingdom", nameRu: "Великобритания", phoneCode: "+44", phoneLength: 10 },
    { code: "US", name: "United States", nameRu: "США", phoneCode: "+1", phoneLength: 10 },
    { code: "UY", name: "Uruguay", nameRu: "Уругвай", phoneCode: "+598", phoneLength: 8 },
    { code: "UZ", name: "Uzbekistan", nameRu: "Узбекистан", phoneCode: "+998", phoneLength: 9 },
    { code: "VE", name: "Venezuela", nameRu: "Венесуэла", phoneCode: "+58", phoneLength: 10 },
    { code: "VN", name: "Vietnam", nameRu: "Вьетнам", phoneCode: "+84", phoneLength: 9 },
];

export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
};

export const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return countryCode || "";

    try {
        const code = countryCode.toUpperCase();
        // Regional Indicator Symbol Letter A starts at U+1F1E6 (127462)
        // Each letter offset from 'A' gets added to this base
        const firstLetter = code.charCodeAt(0);
        const secondLetter = code.charCodeAt(1);

        // Convert to regional indicator symbols
        const flag = String.fromCodePoint(
            0x1F1E6 + (firstLetter - 65), // A = 65 in ASCII
            0x1F1E6 + (secondLetter - 65)
        );

        return flag;
    } catch (error) {
        console.error("Error generating flag for country code:", countryCode, error);
        return countryCode;
    }
};
