export type PremiumAmountInfo = {
    premium_amount?: number | string;
    own_damage_premium?: number | string;
    od_premium?: number | string;

    old_vehicle_charge?: number | string;

    voluntary_excess_amount?: number | string;
    voluntary_excess_discount?: number | string;

    no_claim_discount_amount?: number | string;
    ncd_amount?: number | string;

    basic_premium?: number | string;

    tpl_amount?: number | string;
    third_party_premium?: number | string;

    pool_amount?: number | string;
    rsd_amount?: number | string;
    rsd?: number | string;
    rsd_rider_amount?: number | string;
    rsd_rider?: number | string;
    rsd_passenger_amount?: number | string;
    rsd_passenger?: number | string;

    taxable_amount?: number | string;
    subtotal_amount?: number | string;

    vat_percent?: number | string;
    vat_amount?: number | string;

    stamp_duty?: number | string;

    total_amount?: number | string;
    total_premium?: number | string;
    payable_amount?: number | string;
    conductor_helper_seat_capacity: number | string;
    suminsured?: number | string;

    [key: string]: number | string | boolean | null | undefined;
};

export type PremiumErrorItem = {
    error_code?: string;
    error_message?: string;
};

export type GetPremiumResponse = {
    process_result?: boolean;
    error_list?: PremiumErrorItem[];
    amount_info?: PremiumAmountInfo;

    direct_discount_amount?: number | string;
    direct_discount_percent?: number | string;

    [key: string]: unknown;
};