import * as fs from 'fs';
import * as path from 'path';

export interface UserCredentials {
    username: string;
    password: string;
    userType: 'standard' | 'locked_out' | 'problem' | 'performance_glitch';
}

export interface CheckoutData {
    firstName: string;
    lastName: string;
    postalCode: string;
}

export interface ProductData {
    name: string;
    price: string;
    description: string;
}

export class TestDataManager {
    private static instance: TestDataManager;
    private testData: any;

    private constructor() {
        this.loadTestData();
    }

    public static getInstance(): TestDataManager {
        if (!TestDataManager.instance) {
            TestDataManager.instance = new TestDataManager();
        }
        return TestDataManager.instance;
    }

    private loadTestData(): void {
        const dataPath = path.join(__dirname, '../../data/test-data.json');
        try {
            const data = fs.readFileSync(dataPath, 'utf8');
            this.testData = JSON.parse(data);
        } catch (error) {
            console.warn('Test data file not found, using default data');
            this.testData = this.getDefaultTestData();
        }
    }

    private getDefaultTestData(): any {
        return {
            users: {
                standard: {
                    username: 'standard_user',
                    password: 'secret_sauce',
                    userType: 'standard'
                },
                locked_out: {
                    username: 'locked_out_user',
                    password: 'secret_sauce',
                    userType: 'locked_out'
                },
                problem: {
                    username: 'problem_user',
                    password: 'secret_sauce',
                    userType: 'problem'
                },
                performance_glitch: {
                    username: 'performance_glitch_user',
                    password: 'secret_sauce',
                    userType: 'performance_glitch'
                }
            },
            checkout: {
                valid: {
                    firstName: 'John',
                    lastName: 'Doe',
                    postalCode: '12345'
                },
                invalid: {
                    firstName: '',
                    lastName: '',
                    postalCode: ''
                }
            },
            products: {
                backpack: {
                    name: 'Sauce Labs Backpack',
                    price: '$29.99',
                    description: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.'
                },
                bikeLight: {
                    name: 'Sauce Labs Bike Light',
                    price: '$9.99',
                    description: 'A red light isn\'t the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.'
                },
                boltTshirt: {
                    name: 'Sauce Labs Bolt T-Shirt',
                    price: '$15.99',
                    description: 'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.'
                },
                fleeceJacket: {
                    name: 'Sauce Labs Fleece Jacket',
                    price: '$49.99',
                    description: 'It\'s not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.'
                },
                onesie: {
                    name: 'Sauce Labs Onesie',
                    price: '$7.99',
                    description: 'Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won\'t unravel.'
                },
                redTshirt: {
                    name: 'Test.allTheThings() T-Shirt (Red)',
                    price: '$15.99',
                    description: 'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.'
                }
            }
        };
    }

    public getUserCredentials(userType: keyof typeof this.testData.users): UserCredentials {
        return this.testData.users[userType];
    }

    public getCheckoutData(type: 'valid' | 'invalid'): CheckoutData {
        return this.testData.checkout[type];
    }

    public getProductData(productKey: keyof typeof this.testData.products): ProductData {
        return this.testData.products[productKey];
    }

    public getAllUserTypes(): string[] {
        return Object.keys(this.testData.users);
    }

    public getAllProductKeys(): string[] {
        return Object.keys(this.testData.products);
    }

    public getRandomUserCredentials(): UserCredentials {
        const userTypes = this.getAllUserTypes();
        const randomType = userTypes[Math.floor(Math.random() * userTypes.length)];
        return this.getUserCredentials(randomType as keyof typeof this.testData.users);
    }

    public getRandomProductData(): ProductData {
        const productKeys = this.getAllProductKeys();
        const randomKey = productKeys[Math.floor(Math.random() * productKeys.length)];
        return this.getProductData(randomKey as keyof typeof this.testData.products);
    }

    public generateRandomCheckoutData(): CheckoutData {
        return {
            firstName: `Test${Math.floor(Math.random() * 1000)}`,
            lastName: `User${Math.floor(Math.random() * 1000)}`,
            postalCode: Math.floor(Math.random() * 90000 + 10000).toString()
        };
    }
} 