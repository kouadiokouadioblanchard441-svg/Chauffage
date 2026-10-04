import { 
  users, products, userProducts, deposits, withdrawals, withdrawalWallets,
  withdrawalFeePayments,
  paymentChannels, paymentNumbers, stakingProducts, userStakings, referralCommissions, tasks, userTasks, transactions, platformSettings, adminAuditLog,
  giftCodes, giftCodeClaims, countries,
  type User, type Product, type UserProduct, type Deposit, type Withdrawal, type WithdrawalWallet,
  type PaymentChannel, type PaymentNumber, type StakingProduct, type UserStaking, type ReferralCommission, type Task, type UserTask, type Transaction, type PlatformSetting,
  type GiftCode, type GiftCodeClaim, type Country,
  type WithdrawalFeePayment, type CloudPayWithdrawalAttempt, type CloudPayWithdrawalResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, or, isNull, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { getDemoReferralPreview } from "./demo-referrals";
import { notifyTelegramPaymentEvent } from "./telegram-events";

type TeamStats = {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  demoMemberCount: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1Invested: number;
  level2Invested: number;
  level3Invested: number;
  level1Recharged: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  todayNewMembers: number;
  todayDepositAmount: number;
  todayWithdrawalAmount: number;
};

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getWithdrawableBalance(userId: number): Promise<string>;
  getUserByPhone(phone: string, country: string): Promise<User | undefined>;
  getUserByPhoneAnyCountry(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(filter?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  
  // Products
  getProducts(includeInactive?: boolean): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: Partial<Product>): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // User Products
  getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]>;
  getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]>;
  purchaseProduct(userId: number, productId: number, assignedByAdmin?: boolean): Promise<UserProduct>;
  removeUserProduct(userId: number, productId: number): Promise<void>;
  updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct>;
  processEarnings(): Promise<void>;
  
  // Deposits
  createDeposit(data: Partial<Deposit>): Promise<Deposit>;
  getDeposit(id: number): Promise<Deposit | undefined>;
  getDepositBySendavapayReference(reference: string): Promise<Deposit | undefined>;
  getDepositByInpayOutTradeNo(reference: string): Promise<Deposit | undefined>;
  getDepositByWestpayReference(reference: string): Promise<Deposit | undefined>;
  getDepositByAshtechReference(reference: string): Promise<Deposit | undefined>;
  getDepositByAshtechTransactionId(transactionId: string): Promise<Deposit | undefined>;
  getDepositByCloudPayOrderId(orderId: string): Promise<Deposit | undefined>;
  getPendingAshtechDeposits(): Promise<Deposit[]>;
  claimDepositApproval(id: number): Promise<Deposit | undefined>;
  claimDepositFinalization(id: number, status: "approved" | "rejected"): Promise<Deposit | undefined>;
  finalizeCloudPayDeposit(
    id: number,
    status: "approved" | "rejected",
  ): Promise<{ deposit?: Deposit; finalized: boolean }>;
  claimAdminDepositApproval(id: number, processedBy: number): Promise<Deposit | undefined>;
  getDeposits(status?: string): Promise<(Deposit & { user: User })[]>;
  getUserDeposits(userId: number): Promise<Deposit[]>;
  updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit>;
  cleanupDepositScreenshots(): Promise<void>;
  processDepositReferralCommissions(userId: number, amount: number): Promise<void>;
  
  // Withdrawals
  createWithdrawalFeePayment(data: Partial<WithdrawalFeePayment>): Promise<WithdrawalFeePayment>;
  getWithdrawalFeePayment(id: number): Promise<WithdrawalFeePayment | undefined>;
  getActiveWithdrawalFeePayment(userId: number, withdrawalAmount: number): Promise<WithdrawalFeePayment | undefined>;
  markWithdrawalFeePaymentPaid(id: number, depositId: number): Promise<WithdrawalFeePayment | undefined>;
  claimWithdrawalFeePayment(userId: number, withdrawalAmount: number): Promise<WithdrawalFeePayment | undefined>;
  createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal>;
  getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getWithdrawalByInpayOutTradeNo(reference: string): Promise<Withdrawal | undefined>;
  getWithdrawalByCloudPayOrderId(orderId: string): Promise<Withdrawal | undefined>;
  updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal>;
  claimManualWithdrawalApproval(
    id: number,
    processedBy: number,
    cloudpayResponse?: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined>;
  claimManualWithdrawalRejection(
    id: number,
    processedBy: number,
    cloudpayResponse?: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined>;
  claimWithdrawalForCloudPayPayout(
    id: number,
    orderId: string,
    expectedPreviousOrderId: string | null,
  ): Promise<Withdrawal | undefined>;
  recordCloudPayWithdrawalResponse(
    id: number,
    orderId: string,
    response: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined>;
  recordHistoricalCloudPayWithdrawalResponse(
    id: number,
    orderId: string,
    response: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined>;
  claimWithdrawalFinalization(id: number, status: "approved" | "rejected"): Promise<Withdrawal | undefined>;
  finalizeCloudPayWithdrawal(
    id: number,
    orderId: string,
    status: "approved" | "rejected",
    response: CloudPayWithdrawalResponse,
  ): Promise<{ withdrawal?: Withdrawal; finalized: boolean }>;
  releaseWithdrawalProcessing(
    id: number,
    cloudpayOrderId: string,
    providerRejection?: Pick<
      CloudPayWithdrawalResponse,
      "providerStatus" | "providerHttpStatus" | "amount" | "amountMatches" | "message"
    >,
  ): Promise<Withdrawal | undefined>;
  getUserWithdrawalCountToday(userId: number): Promise<number>;
  
  // Wallets
  getWallets(userId: number): Promise<WithdrawalWallet[]>;
  createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet>;
  deleteWallet(id: number): Promise<void>;
  setDefaultWallet(userId: number, walletId: number): Promise<void>;
  getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined>;
  
  // Payment Channels
  getPaymentChannels(): Promise<PaymentChannel[]>;
  getActivePaymentChannels(): Promise<PaymentChannel[]>;
  getPaymentChannel(id: number): Promise<PaymentChannel | undefined>;
  createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  deletePaymentChannel(id: number): Promise<void>;
  
  // Referrals
  getReferrals(userId: number, level: number): Promise<User[]>;
  createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission>;
  getUserCommissions(userId: number): Promise<number>;
  getTeamStats(userId: number): Promise<TeamStats>;
  getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]>;
  claimTask(userId: number, taskId: number): Promise<void>;
  
  // Transactions
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string, modifiedBy?: number): Promise<void>;
  
  // Admin
  getStats(): Promise<any>;
  logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void>;
  resetStats(): Promise<void>;
  
  // Gift Codes
  getAllGiftCodes(): Promise<GiftCode[]>;
  getGiftCodeByCode(code: string): Promise<GiftCode | undefined>;
  createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode>;
  deleteGiftCode(id: number): Promise<void>;
  hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean>;
  claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void>;

  // Countries
  getCountries(): Promise<Country[]>;
  getActiveCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(data: Partial<Country>): Promise<Country>;
  updateCountry(id: number, data: Partial<Country>): Promise<Country>;
  deleteCountry(id: number): Promise<void>;

  // Payment Numbers
  getPaymentNumbers(): Promise<PaymentNumber[]>;
  getPaymentNumber(id: number): Promise<PaymentNumber | undefined>;
  getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]>;
  createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  deletePaymentNumber(id: number): Promise<void>;

  // Staking
  getStakingProducts(): Promise<StakingProduct[]>;
  getActiveStakingProducts(): Promise<StakingProduct[]>;
  getStakingProduct(id: number): Promise<StakingProduct | undefined>;
  createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct>;
  updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct>;
  deleteStakingProduct(id: number): Promise<void>;
  purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking>;
  getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]>;
  getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]>;
  releaseMaturedStakings(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getWithdrawableBalance(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) return "0.00";

    const approvedDeposits = await db.select({ amount: deposits.amount })
      .from(deposits)
      .where(and(
        eq(deposits.userId, userId),
        eq(deposits.status, "approved"),
        isNull(deposits.withdrawalFeePaymentId),
      ));

    const transactionsForUser = await this.getUserTransactions(userId);
    const depositPrincipal = approvedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const balanceSpentOnProducts = transactionsForUser
      .filter((transaction) => transaction.type === "purchase" || transaction.type === "staking")
      .reduce((sum, transaction) => sum + Math.max(0, -parseFloat(transaction.amount)), 0);
    const protectedDepositBalance = Math.max(0, depositPrincipal - balanceSpentOnProducts);
    const withdrawableBalance = Math.max(0, parseFloat(user.balance) - protectedDepositBalance);

    return withdrawableBalance.toFixed(2);
  }

  async getUserByPhone(phone: string, country: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.country, country)));
    return user || undefined;
  }

  async getUserByPhoneAnyCountry(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`UPPER(${users.referralCode}) = UPPER(${code})`
    );
    return user || undefined;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(data.password!, 10);

    return db.transaction(async (tx) => {
      const [signupBonusSetting] = await tx.select({ value: platformSettings.value })
        .from(platformSettings)
        .where(eq(platformSettings.key, "signupBonus"))
        .limit(1);
      const signupBonus = Number(signupBonusSetting?.value ?? "30");
      if (!Number.isSafeInteger(signupBonus) || signupBonus < 0) {
        throw new Error("The signup bonus must be configured as a non-negative whole PHP amount.");
      }
      const signupBonusAmount = signupBonus.toFixed(2);

      const [user] = await tx.insert(users).values({
        ...data,
        password: hashedPassword,
        referralCode,
        balance: signupBonusAmount,
      } as any).returning();

      if (signupBonus > 0) {
        await tx.insert(transactions).values({
          userId: user.id,
          type: "signup_bonus",
          amount: signupBonusAmount,
          description: "Registration bonus",
        });
      }

      return user;
    });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(filter?: string, limit: number = 50, offset: number = 0): Promise<{ users: User[], total: number }> {
    let conditions: any[] = [];
    
    if (filter && filter.trim()) {
      const searchTerm = `%${filter.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${users.phone}) LIKE ${searchTerm}`,
          sql`LOWER(${users.fullName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.referralCode}) LIKE ${searchTerm}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const userList = await db.select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { users: userList, total: Number(countResult.count) };
  }

  // Products
  async getProducts(includeInactive = false): Promise<Product[]> {
    if (includeInactive) {
      return await db.select().from(products).orderBy(products.sortOrder);
    }
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.sortOrder);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const [product] = await db.insert(products).values(data as any).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // User Products
  async getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    
    return result.map(r => ({ ...r.userProduct, product: r.product }));
  }

  async getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, userId));
    
    return result.sort((a, b) => {
      const dateA = a.userProduct.purchaseDate ? new Date(a.userProduct.purchaseDate).getTime() : 0;
      const dateB = b.userProduct.purchaseDate ? new Date(b.userProduct.purchaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  async purchaseProduct(userId: number, productId: number, assignedByAdmin = false): Promise<UserProduct> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Product not found");
    if (!product.isActive && !assignedByAdmin) throw new Error("Product unavailable");

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    if (!product.isFree && !assignedByAdmin) {
      const balance = parseFloat(user.balance);
      if (balance < product.price) throw new Error("Insufficient balance");
      
      // Check if this is user's first paid investment
      const existingPaidProducts = await db.select()
        .from(userProducts)
        .innerJoin(products, eq(userProducts.productId, products.id))
        .where(and(
          eq(userProducts.userId, userId),
          eq(products.isFree, false),
          eq(userProducts.assignedByAdmin, false)
        ));
      
      const isFirstInvestment = existingPaidProducts.length === 0;
      
      await this.updateUser(userId, { 
        balance: (balance - product.price).toFixed(2),
        hasActiveProduct: true,
      });

      await this.createTransaction({
        userId,
        type: "purchase",
        amount: (-product.price).toString(),
        description: `Purchase ${product.name}`,
      });

      // Process referral commissions ONLY on first investment
      if (isFirstInvestment) {
        await this.processReferralCommissions(userId, product.price, productId);
      }
    } else {
      await this.updateUser(userId, { hasActiveProduct: true });
    }

    // Set lastEarningDate to now - first earnings will be credited 24h after purchase
    const [userProduct] = await db.insert(userProducts).values({
      userId,
      productId,
      daysRemaining: product.cycleDays,
      assignedByAdmin,
      lastEarningDate: new Date(),
    }).returning();

    return userProduct;
  }

  async updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct> {
    const [updated] = await db.update(userProducts)
      .set(data as any)
      .where(eq(userProducts.id, id))
      .returning();
    return updated;
  }

  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await db.update(userProducts)
      .set({ isActive: false })
      .where(and(eq(userProducts.userId, userId), eq(userProducts.productId, productId)));
  }

  async processReferralCommissions(userId: number, amount: number, productId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = parseFloat(settings.level1Commission || "25") / 100;
    const level2Rate = parseFloat(settings.level2Commission || "3") / 100;
    const level3Rate = parseFloat(settings.level3Commission || "2") / 100;

    // Level 1
    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = amount * level1Rate;
      await this.updateUser(level1User.id, {
        balance: (parseFloat(level1User.balance) + commission).toFixed(2),
      });
      await this.createReferralCommission({
        userId: level1User.id,
        fromUserId: userId,
        level: 1,
        amount: commission.toFixed(2),
        productId,
      });
      await this.createTransaction({
        userId: level1User.id,
        type: "commission",
        amount: commission.toFixed(2),
        description: `Level 1 commission from ${user.fullName}`,
      });

      // Level 2
      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const commission2 = amount * level2Rate;
          await this.updateUser(level2User.id, {
            balance: (parseFloat(level2User.balance) + commission2).toFixed(2),
          });
          await this.createReferralCommission({
            userId: level2User.id,
            fromUserId: userId,
            level: 2,
            amount: commission2.toFixed(2),
            productId,
          });
          await this.createTransaction({
            userId: level2User.id,
            type: "commission",
            amount: commission2.toFixed(2),
            description: "Level 2 commission",
          });

          // Level 3
          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const commission3 = amount * level3Rate;
              await this.updateUser(level3User.id, {
                balance: (parseFloat(level3User.balance) + commission3).toFixed(2),
              });
              await this.createReferralCommission({
                userId: level3User.id,
                fromUserId: userId,
                level: 3,
                amount: commission3.toFixed(2),
                productId,
              });
              await this.createTransaction({
                userId: level3User.id,
                type: "commission",
                amount: commission3.toFixed(2),
                description: "Level 3 commission",
              });
            }
          }
        }
      }
    }
  }

  async processEarnings(): Promise<void> {
    const activeProducts = await db.select({
      userProduct: userProducts,
      product: products,
      user: users,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .innerJoin(users, eq(userProducts.userId, users.id))
      .where(and(eq(userProducts.isActive, true), sql`${userProducts.daysRemaining} > 0`));

    const now = new Date();
    
    const userEarnings = new Map<number, number>();
    
    for (const { userProduct, product, user } of activeProducts) {
      try {
        const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
        if (!purchaseDate) continue;

        const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

        const msSincePurchase = now.getTime() - purchaseDate.getTime();
        const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

        const msSinceLastEarning = now.getTime() - lastEarning.getTime();
        const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

        if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
          const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
          const earningsPerCycle = product.dailyEarnings;
          const totalEarningsForProduct = earningsPerCycle * cyclesToCredit;

          const newLastEarningDate = new Date(lastEarning.getTime() + (cyclesToCredit * 24 * 60 * 60 * 1000));

          const currentTotal = userEarnings.get(user.id) || 0;
          userEarnings.set(user.id, currentTotal + totalEarningsForProduct);

          const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
          const updateData: any = {
            lastEarningDate: newLastEarningDate,
            daysRemaining: newDaysRemaining,
            totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
          };
          
          if (newDaysRemaining <= 0) {
            updateData.isActive = false;
          }

          await db.update(userProducts).set(updateData).where(eq(userProducts.id, userProduct.id));

          for (let i = 0; i < cyclesToCredit; i++) {
            await this.createTransaction({
              userId: user.id,
              type: "earning",
              amount: earningsPerCycle.toString(),
              description: `Earnings ${product.name}`,
            });
          }
        }
      } catch (productError) {
        console.error(`processEarnings error for product ${userProduct.id}:`, productError);
      }
    }

    const userEarningEntries: Array<[number, number]> = [];
    userEarnings.forEach((totalEarnings, userId) => {
      userEarningEntries.push([userId, totalEarnings]);
    });

    for (const [userId, totalEarnings] of userEarningEntries) {
      try {
        const freshUser = await this.getUser(userId);
        if (freshUser) {
          const newBalance = parseFloat(freshUser.balance || "0") + totalEarnings;
          const newTodayEarnings = parseFloat(freshUser.todayEarnings || "0") + totalEarnings;
          const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + totalEarnings;
          
          await this.updateUser(userId, {
            balance: newBalance.toFixed(2),
            todayEarnings: newTodayEarnings.toFixed(2),
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      } catch (userError) {
        console.error(`processEarnings user update error for user ${userId}:`, userError);
      }
    }
  }

  // Deposits
  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(data as any).returning();
    notifyTelegramPaymentEvent({
      kind: "deposit",
      phase: "created",
      id: deposit.id,
      userId: deposit.userId,
      amount: deposit.amount,
      status: deposit.status,
      country: deposit.country,
      paymentMethod: deposit.paymentMethod,
      reference: deposit.reference || deposit.cloudpayOrderId || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
      isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
    });
    return deposit;
  }

  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async getDepositBySendavapayReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.sendavapayReference, reference));
    return deposit;
  }

  async getDepositByInpayOutTradeNo(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.inpayOutTradeNo, reference));
    return deposit;
  }

  async getDepositByWestpayReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.westpayReference, reference));
    return deposit;
  }

  async getDepositByAshtechReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.ashtechReference, reference));
    return deposit;
  }

  async getDepositByAshtechTransactionId(transactionId: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.ashtechTransactionId, transactionId));
    return deposit;
  }

  async getDepositByCloudPayOrderId(orderId: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.cloudpayOrderId, orderId));
    return deposit;
  }

  async getPendingAshtechDeposits(): Promise<Deposit[]> {
    return db.select().from(deposits).where(and(
      sql`${deposits.ashtechTransactionId} IS NOT NULL`,
      or(eq(deposits.status, "pending"), eq(deposits.status, "processing")),
    ));
  }

  async claimDepositApproval(id: number): Promise<Deposit | undefined> {
    return this.claimDepositFinalization(id, "approved");
  }

  async claimDepositFinalization(
    id: number,
    status: "approved" | "rejected",
  ): Promise<Deposit | undefined> {
    const [deposit] = await db.update(deposits)
      .set({ status, processedAt: new Date() })
      .where(and(
        eq(deposits.id, id),
        sql`${deposits.status} NOT IN ('approved', 'rejected')`,
        isNull(deposits.processedAt),
      ))
      .returning();
    if (deposit) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async finalizeCloudPayDeposit(
    id: number,
    status: "approved" | "rejected",
  ): Promise<{ deposit?: Deposit; finalized: boolean }> {
    const result = await db.transaction(async (tx) => {
      const [deposit] = await tx.update(deposits)
        .set({ status, processedAt: new Date() })
        .where(and(
          eq(deposits.id, id),
          sql`${deposits.status} NOT IN ('approved', 'rejected')`,
          isNull(deposits.processedAt),
        ))
        .returning();

      if (!deposit) {
        const [current] = await tx.select().from(deposits)
          .where(eq(deposits.id, id))
          .limit(1);
        return { deposit: current, finalized: false };
      }

      if (status === "approved" && deposit.withdrawalFeePaymentId) {
        const [feePayment] = await tx.update(withdrawalFeePayments)
          .set({ status: "paid", depositId: deposit.id, paidAt: new Date() })
          .where(and(
            eq(withdrawalFeePayments.id, deposit.withdrawalFeePaymentId),
            eq(withdrawalFeePayments.userId, deposit.userId),
            sql`${withdrawalFeePayments.status} = 'pending'`,
          ))
          .returning();

        if (!feePayment) {
          const [currentFeePayment] = await tx.select().from(withdrawalFeePayments)
            .where(eq(withdrawalFeePayments.id, deposit.withdrawalFeePaymentId))
            .limit(1);
          if (
            currentFeePayment?.status !== "paid" ||
            currentFeePayment.depositId !== deposit.id ||
            currentFeePayment.userId !== deposit.userId
          ) {
            throw new Error("CloudPay withdrawal-fee payment could not be finalized");
          }
        }
      } else if (status === "approved") {
        const [creditedUser] = await tx.update(users)
          .set({
            balance: sql`${users.balance} + ${deposit.amount}`,
            hasDeposited: true,
          })
          .where(eq(users.id, deposit.userId))
          .returning({ id: users.id });
        if (!creditedUser) throw new Error("CloudPay deposit owner was not found");

        await tx.insert(transactions).values({
          userId: deposit.userId,
          type: "deposit",
          amount: deposit.amount.toString(),
          description: `RobotPay deposit #${deposit.id}`,
        });

        const [sourceUser] = await tx.select({ referredBy: users.referredBy })
          .from(users)
          .where(eq(users.id, deposit.userId))
          .limit(1);

        if (sourceUser?.referredBy) {
          const commissionRows = await tx.select({
            key: platformSettings.key,
            value: platformSettings.value,
          })
            .from(platformSettings)
            .where(inArray(platformSettings.key, [
              "depositCommissionLevel1",
              "depositCommissionLevel2",
              "depositCommissionLevel3",
            ]));
          const commissionSettings = new Map(commissionRows.map((setting) => [setting.key, setting.value]));
          const rates = [
            Number.parseFloat(commissionSettings.get("depositCommissionLevel1") || "5") / 100,
            Number.parseFloat(commissionSettings.get("depositCommissionLevel2") || "2") / 100,
            Number.parseFloat(commissionSettings.get("depositCommissionLevel3") || "1") / 100,
          ];

          let referralCode: string | null | undefined = sourceUser.referredBy;
          for (let index = 0; index < rates.length; index += 1) {
            const rate = rates[index];
            if (!referralCode) break;
            const [referrer] = await tx.select({
              id: users.id,
              referredBy: users.referredBy,
            })
              .from(users)
              .where(sql`UPPER(${users.referralCode}) = UPPER(${referralCode})`)
              .limit(1);
            if (!referrer) break;

            const commission = Math.round(deposit.amount * rate);
            if (commission > 0) {
              const [creditedReferrer] = await tx.update(users)
                .set({ balance: sql`${users.balance} + ${commission}` })
                .where(eq(users.id, referrer.id))
                .returning({ id: users.id });
              if (!creditedReferrer) throw new Error("CloudPay referral recipient was not found");

              await tx.insert(transactions).values({
                userId: referrer.id,
                type: "deposit_commission",
                amount: commission.toString(),
                description: `Level ${index + 1} deposit commission`,
              });
            }
            referralCode = referrer.referredBy;
          }
        }
      }

      return { deposit, finalized: true };
    });

    if (result.finalized && result.deposit) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: result.deposit.id,
        userId: result.deposit.userId,
        amount: result.deposit.amount,
        status: result.deposit.status,
        country: result.deposit.country,
        paymentMethod: result.deposit.paymentMethod,
        reference: result.deposit.reference || result.deposit.cloudpayOrderId,
        isWithdrawalFeePayment: Boolean(result.deposit.withdrawalFeePaymentId),
      });
    }

    return result;
  }

  async claimAdminDepositApproval(id: number, processedBy: number): Promise<Deposit | undefined> {
    const [deposit] = await db.update(deposits)
      .set({ status: "approved", processedAt: new Date(), processedBy })
      .where(and(
        eq(deposits.id, id),
        sql`${deposits.status} <> 'approved'`,
      ))
      .returning();
    if (deposit) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async getDeposits(status?: string): Promise<(Deposit & { user: User })[]> {
    let query = db.select({
      deposit: deposits,
      user: users,
    }).from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(deposits.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.deposit, user: r.user }));
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit> {
    const previous = data.status !== undefined ? await this.getDeposit(id) : undefined;
    const [deposit] = await db.update(deposits).set(data).where(eq(deposits.id, id)).returning();
    if (deposit && data.status !== undefined && previous?.status !== deposit.status) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async cleanupDepositScreenshots(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(deposits)
      .set({ screenshot: null })
      .where(
        and(
          sql`${deposits.screenshot} IS NOT NULL`,
          or(
            and(eq(deposits.status, "approved"), lte(deposits.processedAt, cutoff)),
            and(eq(deposits.status, "rejected"), lte(deposits.processedAt, cutoff)),
          )
        )
      );
  }

  async processDepositReferralCommissions(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = parseFloat(settings.depositCommissionLevel1 || "5") / 100;
    const level2Rate = parseFloat(settings.depositCommissionLevel2 || "2") / 100;
    const level3Rate = parseFloat(settings.depositCommissionLevel3 || "1") / 100;

    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = Math.round(amount * level1Rate);
      if (commission > 0) {
        await this.updateUser(level1User.id, {
          balance: (parseFloat(level1User.balance) + commission).toFixed(2),
        });
        await this.createTransaction({
          userId: level1User.id,
          type: "deposit_commission",
          amount: commission.toString(),
          description: "Level 1 deposit commission",
        });
      }

      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const comm2 = Math.round(amount * level2Rate);
          if (comm2 > 0) {
            await this.updateUser(level2User.id, {
              balance: (parseFloat(level2User.balance) + comm2).toFixed(2),
            });
            await this.createTransaction({
              userId: level2User.id,
              type: "deposit_commission",
              amount: comm2.toString(),
              description: "Level 2 deposit commission",
            });
          }

          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const comm3 = Math.round(amount * level3Rate);
              if (comm3 > 0) {
                await this.updateUser(level3User.id, {
                  balance: (parseFloat(level3User.balance) + comm3).toFixed(2),
                });
                await this.createTransaction({
                  userId: level3User.id,
                  type: "deposit_commission",
                  amount: comm3.toString(),
                  description: "Level 3 deposit commission",
                });
              }
            }
          }
        }
      }
    }
  }

  // Withdrawals
  async createWithdrawalFeePayment(data: Partial<WithdrawalFeePayment>): Promise<WithdrawalFeePayment> {
    const [payment] = await db.insert(withdrawalFeePayments).values(data as any).returning();
    return payment;
  }

  async getWithdrawalFeePayment(id: number): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.select().from(withdrawalFeePayments).where(eq(withdrawalFeePayments.id, id));
    return payment;
  }

  async getActiveWithdrawalFeePayment(
    userId: number,
    withdrawalAmount: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.select()
      .from(withdrawalFeePayments)
      .where(and(
        eq(withdrawalFeePayments.userId, userId),
        eq(withdrawalFeePayments.withdrawalAmount, withdrawalAmount),
        sql`${withdrawalFeePayments.status} IN ('pending', 'paid')`,
      ))
      .orderBy(desc(withdrawalFeePayments.createdAt))
      .limit(1);
    return payment;
  }

  async markWithdrawalFeePaymentPaid(
    id: number,
    depositId: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.update(withdrawalFeePayments)
      .set({ status: "paid", depositId, paidAt: new Date() })
      .where(and(
        eq(withdrawalFeePayments.id, id),
        sql`${withdrawalFeePayments.status} = 'pending'`,
      ))
      .returning();
    if (payment) return payment;
    return this.getWithdrawalFeePayment(id);
  }

  async claimWithdrawalFeePayment(
    userId: number,
    withdrawalAmount: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.update(withdrawalFeePayments)
      .set({ status: "used", usedAt: new Date() })
      .where(and(
        eq(withdrawalFeePayments.userId, userId),
        eq(withdrawalFeePayments.withdrawalAmount, withdrawalAmount),
        sql`${withdrawalFeePayments.status} = 'paid'`,
      ))
      .returning();
    return payment;
  }

  async createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal> {
    const [withdrawal] = await db.insert(withdrawals).values(data as any).returning();
    notifyTelegramPaymentEvent({
      kind: "withdrawal",
      phase: "created",
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      netAmount: withdrawal.netAmount,
      status: withdrawal.status,
      country: withdrawal.country,
      paymentMethod: withdrawal.paymentMethod,
      reference: withdrawal.cloudpayOrderId || withdrawal.inpayOutTradeNo,
    });
    return withdrawal;
  }

  async getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]> {
    let query = db.select({
      withdrawal: withdrawals,
      user: users,
    }).from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(withdrawals.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.withdrawal, user: r.user }));
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async getWithdrawalByInpayOutTradeNo(reference: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.inpayOutTradeNo, reference));
    return withdrawal;
  }

  async getWithdrawalByCloudPayOrderId(orderId: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(or(
      eq(withdrawals.cloudpayOrderId, orderId),
      sql`${withdrawals.cloudpayResponse}->'attempts' @> ${JSON.stringify([{ orderId }])}::jsonb`,
    ));
    if (withdrawal) return withdrawal;

    const [retryAudit] = await db.select({ details: adminAuditLog.details })
      .from(adminAuditLog)
      .where(and(
        eq(adminAuditLog.action, "retry_cloudpay_withdrawal"),
        sql`${adminAuditLog.details} LIKE ${`%previous CloudPay order ${orderId}%`}`,
      ))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(1);
    const withdrawalId = retryAudit?.details.match(/Withdrawal ID: (\d+)/)?.[1];
    return withdrawalId ? this.getWithdrawalById(Number(withdrawalId)) : undefined;
  }

  async updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal> {
    const previous = data.status !== undefined ? await this.getWithdrawalById(id) : undefined;
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    if (withdrawal && data.status !== undefined && previous?.status !== withdrawal.status) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: withdrawal.cloudpayOrderId || withdrawal.inpayOutTradeNo,
      });
    }
    return withdrawal;
  }

  async claimManualWithdrawalApproval(
    id: number,
    processedBy: number,
    cloudpayResponse?: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals)
      .set({
        status: "approved",
        processedAt: new Date(),
        processedBy,
        ...(cloudpayResponse ? { cloudpayResponse } : {}),
      })
      .where(and(
        eq(withdrawals.id, id),
        or(
          eq(withdrawals.status, "pending"),
          and(
            eq(withdrawals.status, "processing"),
            sql`${withdrawals.cloudpayOrderId} IS NOT NULL`,
          ),
        ),
        sql`${withdrawals.inpayOutTradeNo} IS NULL`,
        sql`${withdrawals.inpayOrderNumber} IS NULL`,
        sql`${withdrawals.omnipayId} IS NULL`,
        sql`${withdrawals.omnipayReference} IS NULL`,
      ))
      .returning();
    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
      });
    }
    return withdrawal;
  }

  async claimManualWithdrawalRejection(
    id: number,
    processedBy: number,
    cloudpayResponse?: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined> {
    const withdrawal = await db.transaction(async (tx) => {
      const [claimed] = await tx.update(withdrawals)
        .set({
          status: "rejected",
          processedAt: new Date(),
          processedBy,
          ...(cloudpayResponse ? { cloudpayResponse } : {}),
        })
        .where(and(
          eq(withdrawals.id, id),
          or(
            eq(withdrawals.status, "pending"),
            and(
              eq(withdrawals.status, "processing"),
              sql`${withdrawals.cloudpayOrderId} IS NOT NULL`,
            ),
          ),
          isNull(withdrawals.inpayOutTradeNo),
          isNull(withdrawals.inpayOrderNumber),
          isNull(withdrawals.omnipayId),
          isNull(withdrawals.omnipayReference),
        ))
        .returning();
      if (!claimed) return undefined;

      const [refundedUser] = await tx.update(users)
        .set({ balance: sql`${users.balance} + ${claimed.amount}` })
        .where(eq(users.id, claimed.userId))
        .returning({ id: users.id });
      if (!refundedUser) throw new Error("Withdrawal owner was not found for refund");

      await tx.insert(transactions).values({
        userId: claimed.userId,
        type: "withdrawal_refund",
        amount: claimed.amount.toString(),
        description: `Manual withdrawal refund #${claimed.id}`,
      });
      return claimed;
    });

    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
      });
    }
    return withdrawal;
  }

  async claimWithdrawalForCloudPayPayout(
    id: number,
    orderId: string,
    expectedPreviousOrderId: string | null,
  ): Promise<Withdrawal | undefined> {
    const withdrawal = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(withdrawals)
        .where(eq(withdrawals.id, id))
        .for("update");
      if (
        !current ||
        !(
          current.status === "pending" ||
          (current.status === "processing" && current.cloudpayOrderId)
        ) ||
        (current.cloudpayOrderId || null) !== expectedPreviousOrderId ||
        current.inpayOutTradeNo ||
        current.inpayOrderNumber ||
        current.omnipayId ||
        current.omnipayReference
      ) {
        return undefined;
      }

      const now = new Date().toISOString();
      const attempts: CloudPayWithdrawalAttempt[] = [
        ...(current.cloudpayResponse?.attempts || []),
      ];
      if (current.cloudpayOrderId) {
        const previousResponse = current.cloudpayResponse;
        attempts.push({
          orderId: current.cloudpayOrderId,
          status: previousResponse?.status || "unknown",
          ...(previousResponse?.providerStatus ? { providerStatus: previousResponse.providerStatus } : {}),
          ...(previousResponse?.providerHttpStatus !== undefined
            ? { providerHttpStatus: previousResponse.providerHttpStatus }
            : {}),
          ...(previousResponse?.requestOutcome ? { requestOutcome: previousResponse.requestOutcome } : {}),
          ...(previousResponse?.amount ? { amount: previousResponse.amount } : {}),
          ...(previousResponse?.amountMatches !== undefined ? { amountMatches: previousResponse.amountMatches } : {}),
          ...(previousResponse?.statusMatches !== undefined ? { statusMatches: previousResponse.statusMatches } : {}),
          ...(previousResponse?.message ? { message: previousResponse.message } : {}),
          ...(previousResponse?.receivedAt ? { receivedAt: previousResponse.receivedAt } : {}),
          endedAt: now,
          endReason: "superseded",
        });
      }

      const nextResponse: CloudPayWithdrawalResponse = {
        source: "payout",
        status: "pending",
        providerStatus: "request_started",
        receivedAt: now,
        ...(attempts.length ? { attempts } : {}),
      };
      const [claimed] = await tx.update(withdrawals)
        .set({
          status: "processing",
          cloudpayOrderId: orderId,
          cloudpayResponse: nextResponse,
          processedAt: null,
          processedBy: null,
        })
        .where(and(
          eq(withdrawals.id, id),
          or(
            eq(withdrawals.status, "pending"),
            and(
              eq(withdrawals.status, "processing"),
              sql`${withdrawals.cloudpayOrderId} IS NOT NULL`,
            ),
          ),
          expectedPreviousOrderId
            ? eq(withdrawals.cloudpayOrderId, expectedPreviousOrderId)
            : isNull(withdrawals.cloudpayOrderId),
          isNull(withdrawals.inpayOutTradeNo),
          isNull(withdrawals.inpayOrderNumber),
          isNull(withdrawals.omnipayId),
          isNull(withdrawals.omnipayReference),
        ))
        .returning();
      return claimed;
    });
    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: withdrawal.cloudpayOrderId,
      });
    }
    return withdrawal;
  }

  private async getWithdrawalById(id: number): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal;
  }

  async claimWithdrawalFinalization(
    id: number,
    status: "approved" | "rejected",
  ): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals)
      .set({ status, processedAt: new Date() })
      .where(and(
        eq(withdrawals.id, id),
        sql`${withdrawals.status} NOT IN ('approved', 'rejected')`,
      ))
      .returning();
    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: withdrawal.cloudpayOrderId || withdrawal.inpayOutTradeNo,
      });
    }
    return withdrawal;
  }

  async recordCloudPayWithdrawalResponse(
    id: number,
    orderId: string,
    response: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined> {
    const [current] = await db.select().from(withdrawals).where(and(
      eq(withdrawals.id, id),
      eq(withdrawals.cloudpayOrderId, orderId),
    ));
    if (!current) return undefined;
    const isTerminal = current.status === "approved" || current.status === "rejected";
    const normalizedResponse: CloudPayWithdrawalResponse = isTerminal && response.source === "query"
      ? {
          ...response,
          statusMatches:
            response.status !== "pending" && response.status === current.status,
        }
      : response;
    const enrichedResponse: CloudPayWithdrawalResponse = {
      ...normalizedResponse,
      ...(current.cloudpayResponse?.attempts
        ? { attempts: current.cloudpayResponse.attempts }
        : {}),
      ...(current.cloudpayResponse?.adminOverride
        ? { adminOverride: current.cloudpayResponse.adminOverride }
        : {}),
    };
    const [withdrawal] = await db.update(withdrawals)
      .set({ cloudpayResponse: enrichedResponse })
      .where(and(
        eq(withdrawals.id, id),
        eq(withdrawals.cloudpayOrderId, orderId),
        or(
          sql`${withdrawals.status} NOT IN ('approved', 'rejected')`,
          isNull(withdrawals.cloudpayResponse),
          sql`${withdrawals.cloudpayResponse}->>'statusMatches' = 'false'`,
          sql`${withdrawals.processedBy} IS NOT NULL`,
        ),
      ))
      .returning();
    return withdrawal;
  }

  async recordHistoricalCloudPayWithdrawalResponse(
    id: number,
    orderId: string,
    response: CloudPayWithdrawalResponse,
  ): Promise<Withdrawal | undefined> {
    return db.transaction(async (tx) => {
      const [current] = await tx.select().from(withdrawals)
        .where(eq(withdrawals.id, id))
        .for("update");
      if (!current?.cloudpayResponse?.attempts?.some((attempt) => attempt.orderId === orderId)) {
        return undefined;
      }
      const attempts = current.cloudpayResponse.attempts.map((attempt) =>
        attempt.orderId === orderId
          ? {
              ...attempt,
              status: response.status,
              providerStatus: response.providerStatus,
              ...(response.providerHttpStatus !== undefined
                ? { providerHttpStatus: response.providerHttpStatus }
                : {}),
              ...(response.requestOutcome ? { requestOutcome: response.requestOutcome } : {}),
              ...(response.amount ? { amount: response.amount } : {}),
              ...(response.amountMatches !== undefined ? { amountMatches: response.amountMatches } : {}),
              ...(response.statusMatches !== undefined ? { statusMatches: response.statusMatches } : {}),
              ...(response.message ? { message: response.message } : {}),
              receivedAt: response.receivedAt,
            }
          : attempt,
      );
      const [updated] = await tx.update(withdrawals)
        .set({
          cloudpayResponse: { ...current.cloudpayResponse, attempts },
        })
        .where(eq(withdrawals.id, id))
        .returning();
      return updated;
    });
  }

  async finalizeCloudPayWithdrawal(
    id: number,
    orderId: string,
    status: "approved" | "rejected",
    response: CloudPayWithdrawalResponse,
  ): Promise<{ withdrawal?: Withdrawal; finalized: boolean }> {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(withdrawals)
        .where(eq(withdrawals.id, id))
        .for("update");
      if (!current || current.cloudpayOrderId !== orderId) {
        return { withdrawal: current, finalized: false };
      }
      const enrichedResponse: CloudPayWithdrawalResponse = {
        ...response,
        ...(current.cloudpayResponse?.attempts
          ? { attempts: current.cloudpayResponse.attempts }
          : {}),
        ...(current.cloudpayResponse?.adminOverride
          ? { adminOverride: current.cloudpayResponse.adminOverride }
          : {}),
      };
      const [withdrawal] = await tx.update(withdrawals)
        .set(status === "approved"
          ? { status: "approved", processedAt: new Date(), cloudpayResponse: enrichedResponse }
          : {
              status: "pending",
              processedAt: null,
              processedBy: null,
              cloudpayResponse: enrichedResponse,
            })
        .where(and(
          eq(withdrawals.id, id),
          eq(withdrawals.cloudpayOrderId, orderId),
          sql`${withdrawals.status} NOT IN ('approved', 'rejected')`,
        ))
        .returning();

      if (!withdrawal) {
        return { withdrawal: current, finalized: false };
      }

      return { withdrawal, finalized: true };
    });

    if (result.finalized && result.withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: result.withdrawal.id,
        userId: result.withdrawal.userId,
        amount: result.withdrawal.amount,
        netAmount: result.withdrawal.netAmount,
        status: result.withdrawal.status,
        country: result.withdrawal.country,
        paymentMethod: result.withdrawal.paymentMethod,
        reference: result.withdrawal.cloudpayOrderId,
      });
    }
    return result;
  }

  async releaseWithdrawalProcessing(
    id: number,
    cloudpayOrderId: string,
    providerRejection?: Pick<
      CloudPayWithdrawalResponse,
      "providerStatus" | "providerHttpStatus" | "amount" | "amountMatches" | "message"
    >,
  ): Promise<Withdrawal | undefined> {
    const withdrawal = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(withdrawals)
        .where(and(eq(withdrawals.id, id), eq(withdrawals.cloudpayOrderId, cloudpayOrderId)))
        .for("update");
      if (!current || current.status !== "processing") return undefined;
      const now = new Date().toISOString();
      const attempts: CloudPayWithdrawalAttempt[] = [
        ...(current.cloudpayResponse?.attempts || []),
        {
          orderId: cloudpayOrderId,
          status: "rejected",
          providerStatus: providerRejection?.providerStatus || "not_accepted",
          requestOutcome: "not_accepted",
          ...(providerRejection?.providerHttpStatus !== undefined
            ? { providerHttpStatus: providerRejection.providerHttpStatus }
            : {}),
          ...(providerRejection?.amount ? { amount: providerRejection.amount } : {}),
          ...(providerRejection?.amountMatches !== undefined
            ? { amountMatches: providerRejection.amountMatches }
            : {}),
          ...(providerRejection?.message ? { message: providerRejection.message } : {}),
          ...(!providerRejection?.amount && current.cloudpayResponse?.amount
            ? { amount: current.cloudpayResponse.amount }
            : {}),
          ...(providerRejection?.amountMatches === undefined &&
          current.cloudpayResponse?.amountMatches !== undefined
            ? { amountMatches: current.cloudpayResponse.amountMatches }
            : {}),
          receivedAt: current.cloudpayResponse?.receivedAt || now,
          endedAt: now,
          endReason: "not_accepted",
        },
      ];
      const response: CloudPayWithdrawalResponse = {
        source: "payout",
        status: "rejected",
        providerStatus: providerRejection?.providerStatus || "not_accepted",
        requestOutcome: "not_accepted",
        ...(providerRejection?.providerHttpStatus !== undefined
          ? { providerHttpStatus: providerRejection.providerHttpStatus }
          : {}),
        ...(providerRejection?.amount ? { amount: providerRejection.amount } : {}),
        ...(providerRejection?.amountMatches !== undefined
          ? { amountMatches: providerRejection.amountMatches }
          : {}),
        ...(providerRejection?.message ? { message: providerRejection.message } : {}),
        receivedAt: now,
        attempts,
        ...(current.cloudpayResponse?.adminOverride
          ? { adminOverride: current.cloudpayResponse.adminOverride }
          : {}),
      };
      const [released] = await tx.update(withdrawals)
        .set({ status: "pending", cloudpayOrderId: null, cloudpayResponse: response })
        .where(and(
          eq(withdrawals.id, id),
          eq(withdrawals.cloudpayOrderId, cloudpayOrderId),
          eq(withdrawals.status, "processing"),
        ))
        .returning();
      return released;
    });
    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: cloudpayOrderId,
      });
    }
    return withdrawal;
  }

  async getUserWithdrawalCountToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(and(
        eq(withdrawals.userId, userId),
        gte(withdrawals.createdAt, today)
      ));
    
    return result[0]?.count || 0;
  }

  // Wallets
  async getWallets(userId: number): Promise<WithdrawalWallet[]> {
    return await db.select().from(withdrawalWallets).where(eq(withdrawalWallets.userId, userId));
  }

  async createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet> {
    // Set other wallets as non-default
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, data.userId!));
    
    const [wallet] = await db.insert(withdrawalWallets).values({ ...data, isDefault: true } as any).returning();
    return wallet;
  }

  async deleteWallet(id: number): Promise<void> {
    await db.delete(withdrawalWallets).where(eq(withdrawalWallets.id, id));
  }

  async setDefaultWallet(userId: number, walletId: number): Promise<void> {
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, userId));
    await db.update(withdrawalWallets).set({ isDefault: true }).where(eq(withdrawalWallets.id, walletId));
  }

  async getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined> {
    const [wallet] = await db.select().from(withdrawalWallets)
      .where(and(eq(withdrawalWallets.userId, userId), eq(withdrawalWallets.isDefault, true)));
    return wallet || undefined;
  }

  // Payment Channels
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels);
  }

  async getActivePaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels).where(eq(paymentChannels.isActive, true));
  }

  async getPaymentChannel(id: number): Promise<PaymentChannel | undefined> {
    const [channel] = await db.select().from(paymentChannels).where(eq(paymentChannels.id, id));
    return channel || undefined;
  }

  async createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.insert(paymentChannels).values(data as any).returning();
    return channel;
  }

  async updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.update(paymentChannels).set({ ...data, modifiedAt: new Date() }).where(eq(paymentChannels.id, id)).returning();
    return channel;
  }

  async deletePaymentChannel(id: number): Promise<void> {
    await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  }

  // Referrals
  private async getReferralLevels(userId: number): Promise<[User[], User[], User[]]> {
    const user = await this.getUser(userId);
    if (!user) return [[], [], []];

    const level1 = await db.select().from(users)
      .where(eq(users.referredBy, user.referralCode))
      .orderBy(desc(users.createdAt), desc(users.id));
    const level1Codes = level1.map(member => member.referralCode);
    const level2 = level1Codes.length
      ? await db.select().from(users)
        .where(inArray(users.referredBy, level1Codes))
        .orderBy(desc(users.createdAt), desc(users.id))
      : [];
    const level2Codes = level2.map(member => member.referralCode);
    const level3 = level2Codes.length
      ? await db.select().from(users)
        .where(inArray(users.referredBy, level2Codes))
        .orderBy(desc(users.createdAt), desc(users.id))
      : [];

    return [level1, level2, level3];
  }

  async getReferrals(userId: number, level: number): Promise<User[]> {
    if (!Number.isInteger(level) || level < 1 || level > 3) return [];
    const levels = await this.getReferralLevels(userId);
    return levels[level - 1];
  }

  async createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission> {
    const [commission] = await db.insert(referralCommissions).values(data as any).returning();
    return commission;
  }

  async getUserCommissions(userId: number): Promise<number> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    return parseFloat(result[0]?.total || "0");
  }

  async getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }> {
    const user = await this.getUser(userId);
    if (!user) return { level1Count: 0, level2Count: 0, level3Count: 0, totalCommission: 0 };

    const level1Result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredBy, user.referralCode));
    const level1Count = Number(level1Result[0]?.count || 0);

    let level2Count = 0;
    let level3Count = 0;
    
    if (level1Count > 0) {
      const level1Codes = await db.select({ code: users.referralCode })
        .from(users)
        .where(eq(users.referredBy, user.referralCode));
      
      if (level1Codes.length > 0) {
        const level2Result = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
        level2Count = Number(level2Result[0]?.count || 0);
        
        if (level2Count > 0) {
          const level2Codes = await db.select({ code: users.referralCode })
            .from(users)
            .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
          
          if (level2Codes.length > 0) {
            const level3Result = await db.select({ count: sql<number>`count(*)` })
              .from(users)
              .where(sql`${users.referredBy} IN (${sql.join(level2Codes.map(u => sql`${u.code}`), sql`, `)})`);
            level3Count = Number(level3Result[0]?.count || 0);
          }
        }
      }
    }

    const commResult = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    const totalCommission = parseFloat(commResult[0]?.total || "0");

    return { level1Count, level2Count, level3Count, totalCommission };
  }

  async getTeamStats(userId: number): Promise<TeamStats> {
    const [level1, level2, level3] = await this.getReferralLevels(userId);
    const totalCommission = await this.getUserCommissions(userId);
    const teamIds = Array.from(new Set([...level1, ...level2, ...level3].map(member => member.id)));
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    let totalDepositAmount = 0;
    let totalWithdrawalAmount = 0;
    let todayDepositAmount = 0;
    let todayWithdrawalAmount = 0;
    if (teamIds.length > 0) {
      const [depositTotals] = await db.select({
        total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`,
        today: sql<string>`COALESCE(SUM(CASE WHEN ${deposits.processedAt} >= ${todayStart} THEN ${deposits.amount} ELSE 0 END), 0)`,
      }).from(deposits).where(and(inArray(deposits.userId, teamIds), eq(deposits.status, "approved")));
      const [withdrawalTotals] = await db.select({
        total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`,
        today: sql<string>`COALESCE(SUM(CASE WHEN ${withdrawals.processedAt} >= ${todayStart} THEN ${withdrawals.amount} ELSE 0 END), 0)`,
      }).from(withdrawals).where(and(inArray(withdrawals.userId, teamIds), eq(withdrawals.status, "approved")));
      totalDepositAmount = Number(depositTotals.total);
      todayDepositAmount = Number(depositTotals.today);
      totalWithdrawalAmount = Number(withdrawalTotals.total);
      todayWithdrawalAmount = Number(withdrawalTotals.today);
    }

    const getCommissionByLevel = async (level: number) => {
      const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(eq(referralCommissions.userId, userId), eq(referralCommissions.level, level)));
      return parseFloat(result[0]?.total || "0");
    };

    const countInvested = async (userList: User[]) => {
      let count = 0;
      for (const u of userList) {
        if (u.hasActiveProduct) count++;
      }
      return count;
    };

    const countRecharged = async (userList: User[]) => {
      const userIds = userList.map(user => user.id);
      if (!userIds.length) return 0;
      const rows = await db.selectDistinct({ userId: deposits.userId }).from(deposits)
        .where(and(inArray(deposits.userId, userIds), eq(deposits.status, "approved")));
      return rows.length;
    };

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      demoMemberCount: [...level1, ...level2, ...level3].filter(member => member.phone.startsWith("DEMO-")).length,
      totalCommission,
      level1Commission: await getCommissionByLevel(1),
      level2Commission: await getCommissionByLevel(2),
      level3Commission: await getCommissionByLevel(3),
      level1Invested: await countInvested(level1),
      level2Invested: await countInvested(level2),
      level3Invested: await countInvested(level3),
      level1Recharged: await countRecharged(level1),
      totalDepositAmount,
      totalWithdrawalAmount,
      todayNewMembers: [...level1, ...level2, ...level3]
        .filter(member => !member.phone.startsWith("DEMO-") && member.createdAt >= todayStart).length,
      todayDepositAmount,
      todayWithdrawalAmount,
    };
  }

  async getDetailedTeam(userId: number): Promise<any> {
    const [level1, level2, level3] = await this.getReferralLevels(userId);
    const members = [...level1, ...level2, ...level3];
    const memberIds = Array.from(new Set(members.map(member => member.id)));
    const countryCodes = Array.from(new Set(members.map(member => member.country)));

    const [commissionRows, productRows, stakingRows, countryRows] = await Promise.all([
      memberIds.length
        ? db.select({
            memberId: referralCommissions.fromUserId,
            total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)`,
          }).from(referralCommissions)
          .where(and(eq(referralCommissions.userId, userId), inArray(referralCommissions.fromUserId, memberIds)))
          .groupBy(referralCommissions.fromUserId)
        : [],
      memberIds.length
        ? db.select({
            memberId: userProducts.userId,
            productName: products.name,
            productPrice: products.price,
            isFree: products.isFree,
            purchaseDate: userProducts.purchaseDate,
            isActive: userProducts.isActive,
          }).from(userProducts)
          .innerJoin(products, eq(userProducts.productId, products.id))
          .where(inArray(userProducts.userId, memberIds))
        : [],
      memberIds.length
        ? db.select({ memberId: userStakings.userId, name: stakingProducts.name })
          .from(userStakings)
          .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
          .where(inArray(userStakings.userId, memberIds))
        : [],
      countryCodes.length
        ? db.select({ code: countries.code, phonePrefix: countries.phonePrefix })
          .from(countries).where(inArray(countries.code, countryCodes))
        : [],
    ]);
    const revenueByMember = new Map(commissionRows.map(row => [row.memberId, Number(row.total)]));
    const prefixByCountry = new Map(countryRows.map(row => [row.code, row.phonePrefix]));
    const productsByMember = new Map<number, Array<(typeof productRows)[number]>>();
    for (const row of productRows) {
      if (!productsByMember.has(row.memberId)) productsByMember.set(row.memberId, []);
      productsByMember.get(row.memberId)!.push(row);
    }
    const stakingVipByMember = new Map<number, number>();
    for (const row of stakingRows) {
      const level = Number(/^Produit\s*(\d+)$/i.exec(row.name)?.[1] || 0);
      stakingVipByMember.set(row.memberId, Math.max(stakingVipByMember.get(row.memberId) || 0, level));
    }

    const enrichUser = (user: User) => {
      const userProductsList = productsByMember.get(user.id) || [];
      const totalInvested = userProductsList.reduce((sum, p) => sum + p.productPrice, 0);
      const demoPreview = getDemoReferralPreview(user.phone);
      const prefix = prefixByCountry.get(user.country) || null;
      let digits = user.phone.replace(/\D/g, "");
      const countryPrefix = prefix?.replace(/\D/g, "") || "";
      const isInternational = user.phone.trim().startsWith("+") ||
        Boolean(countryPrefix && digits.startsWith(countryPrefix) && digits.length > countryPrefix.length + 5);
      if (isInternational && countryPrefix && digits.startsWith(countryPrefix)) {
        digits = digits.slice(countryPrefix.length);
      }
      const maskedPhone = demoPreview?.maskedPhone ||
        (digits.length > 5 ? `${digits.slice(0, 3)}***${digits.slice(-2)}` : "***");
      const whatsappNumber = demoPreview
        ? null
        : isInternational
          ? `${countryPrefix}${digits}`
          : countryPrefix
            ? `${countryPrefix}${digits}`
            : null;
      const vipLevel = Math.max(
        stakingVipByMember.get(user.id) || 0,
        ...userProductsList.filter(p => !p.isFree).map(p => Number(/^VIP\s*(\d+)$/i.exec(p.productName)?.[1] || 0)),
      );

      return {
        id: user.id,
        maskedPhone,
        whatsappNumber: whatsappNumber && /^\d{8,15}$/.test(whatsappNumber) ? whatsappNumber : null,
        isDemo: Boolean(demoPreview),
        demoPreview,
        totalInvested,
        totalReferralRevenue: revenueByMember.get(user.id) || 0,
        vipLevel: vipLevel || null,
      };
    };

    const level1Details = level1.map(enrichUser);
    const level2Details = level2.map(enrichUser);
    const level3Details = level3.map(enrichUser);

    return {
      level1: level1Details,
      level2: level2Details,
      level3: level3Details,
      totalLevel1Invested: level1Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel2Invested: level2Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel3Invested: level3Details.reduce((sum, u) => sum + u.totalInvested, 0),
    };
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(tasks.sortOrder);
  }

  async getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]> {
    const allTasks = await this.getTasks();
    const user = await this.getUser(userId);
    if (!user) return [];

    const level1Refs = await this.getReferrals(userId, 1);
    
    let currentInvites = 0;
    for (const ref of level1Refs) {
      const hasApprovedDeposit = ref.hasDeposited === true;
      
      if (!hasApprovedDeposit) {
        const refDeposits = await db.select().from(deposits)
          .where(and(eq(deposits.userId, ref.id), eq(deposits.status, "approved")))
          .limit(1);
        if (refDeposits.length > 0) {
          currentInvites++;
          continue;
        }
      } else {
        currentInvites++;
        continue;
      }

      const refProducts = await db.select()
        .from(userProducts)
        .innerJoin(products, eq(userProducts.productId, products.id))
        .where(and(
          eq(userProducts.userId, ref.id),
          eq(products.isFree, false)
        ))
        .limit(1);

      if (refProducts.length > 0) {
        currentInvites++;
      }
    }

    const completedTasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    return allTasks.map(task => ({
      ...task,
      isCompleted: completedIds.has(task.id),
      canClaim: !completedIds.has(task.id) && currentInvites >= task.requiredInvites,
      currentInvites: currentInvites,
    }));
  }

  async claimTask(userId: number, taskId: number): Promise<void> {
    const tasksStatus = await this.getTasksWithStatus(userId);
    const taskStatus = tasksStatus.find(t => t.id === taskId);

    if (!taskStatus) throw new Error("Task not found");
    if (taskStatus.isCompleted) throw new Error("Task already claimed");
    if (!taskStatus.canClaim) throw new Error("Requirements not met (deposit and purchase required)");

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    await db.insert(userTasks).values({ userId, taskId });
    
    const newBalance = parseFloat(user.balance) + taskStatus.reward;
    await this.updateUser(userId, { balance: newBalance.toFixed(2) });
    
    await this.createTransaction({
      userId,
      type: "task_reward",
      amount: taskStatus.reward.toString(),
      description: `Reward: ${taskStatus.name}`,
    });
  }

  // Transactions
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data as any).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value || null;
  }

  async getSettings(): Promise<Record<string, string>> {
    const allSettings = await db.select().from(platformSettings);
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async setSetting(key: string, value: string, modifiedBy?: number): Promise<void> {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    if (existing.length > 0) {
      await db.update(platformSettings).set({ value, modifiedBy, modifiedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value, modifiedBy, modifiedAt: new Date() });
    }
  }

  // Admin
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer la date de réinitialisation des stats
    const statsResetDateStr = await this.getSetting("statsResetDate");
    const statsResetDate = statsResetDateStr ? new Date(statsResetDateStr) : new Date(0);
    
    const filterStart = startDate || new Date(0);
    const filterEnd = endDate || new Date();
    filterEnd.setHours(23, 59, 59, 999);

    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, statsResetDate));
    const [todayUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, today));
    const [periodUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(gte(users.createdAt, filterStart), lte(users.createdAt, filterEnd)));
    
    const [totalDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, statsResetDate)));
    const [todayDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, today)));
    const [periodDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, filterStart), lte(deposits.createdAt, filterEnd)));
    const [pendingDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`, count: sql<number>`count(*)` })
      .from(deposits).where(inArray(deposits.status, ["pending", "processing"]));
    
    const [totalWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, statsResetDate)));
    const [todayWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, today)));
    const [periodWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, filterStart), lte(withdrawals.createdAt, filterEnd)));
    const [pendingWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`, count: sql<number>`count(*)` })
      .from(withdrawals).where(eq(withdrawals.status, "pending"));
    
    const [usersWithProductsResult] = await db.select({ count: sql<number>`count(DISTINCT ${userProducts.userId})` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    // Récupérer les valeurs baseline pour les compteurs cumulatifs
    const baselineBalance = parseFloat(await this.getSetting("baselineTotalBalance") || "0");
    const baselineEarnings = parseFloat(await this.getSetting("baselineTotalEarnings") || "0");
    const baselineCommissions = parseFloat(await this.getSetting("baselineTotalCommissions") || "0");
    
    const [totalBalanceResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalEarningsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalProductsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    const [totalCommissionsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(transactions).where(eq(transactions.type, "commission"));

    // Soustraire les valeurs baseline pour obtenir les stats depuis la réinitialisation
    const adjustedBalance = Math.max(0, parseFloat(totalBalanceResult?.total || "0") - baselineBalance);
    const adjustedEarnings = Math.max(0, parseFloat(totalEarningsResult?.total || "0") - baselineEarnings);
    const adjustedCommissions = Math.max(0, parseFloat(totalCommissionsResult?.total || "0") - baselineCommissions);

    return {
      totalUsers: totalUsersResult?.count || 0,
      todayUsers: todayUsersResult?.count || 0,
      periodUsers: periodUsersResult?.count || 0,
      totalDeposits: parseFloat(totalDepositsResult?.total || "0"),
      todayDeposits: parseFloat(todayDepositsResult?.total || "0"),
      periodDeposits: parseFloat(periodDepositsResult?.total || "0"),
      pendingDeposits: parseFloat(pendingDepositsResult?.total || "0"),
      pendingDepositsCount: pendingDepositsResult?.count || 0,
      totalWithdrawals: parseFloat(totalWithdrawalsResult?.total || "0"),
      todayWithdrawals: parseFloat(todayWithdrawalsResult?.total || "0"),
      periodWithdrawals: parseFloat(periodWithdrawalsResult?.total || "0"),
      pendingWithdrawals: parseFloat(pendingWithdrawalsResult?.total || "0"),
      pendingWithdrawalsCount: pendingWithdrawalsResult?.count || 0,
      usersWithProducts: usersWithProductsResult?.count || 0,
      totalBalance: adjustedBalance,
      totalEarnings: adjustedEarnings,
      totalActiveProducts: totalProductsResult?.count || 0,
      totalCommissions: adjustedCommissions,
    };
  }

  async logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void> {
    await db.insert(adminAuditLog).values({ adminId, action, targetUserId, details });
  }

  async resetStats(): Promise<void> {
    // Stocke la date de réinitialisation - les stats ne comptent que les données après cette date
    await this.setSetting("statsResetDate", new Date().toISOString());
    
    // Stocker les valeurs baseline pour les compteurs cumulatifs (solde et gains)
    const [currentBalance] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` }).from(users);
    const [currentEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` }).from(users);
    const [currentCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(transactions).where(eq(transactions.type, "commission"));
    
    await this.setSetting("baselineTotalBalance", currentBalance?.total || "0");
    await this.setSetting("baselineTotalEarnings", currentEarnings?.total || "0");
    await this.setSetting("baselineTotalCommissions", currentCommissions?.total || "0");
  }

  // Gift Codes
  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async getGiftCodeByCode(code: string): Promise<GiftCode | undefined> {
    const [giftCode] = await db.select().from(giftCodes).where(
      sql`UPPER(${giftCodes.code}) = UPPER(${code})`
    );
    return giftCode || undefined;
  }

  async createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode> {
    const [giftCode] = await db.insert(giftCodes).values(data).returning();
    return giftCode;
  }

  async deleteGiftCode(id: number): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean> {
    const [claim] = await db.select().from(giftCodeClaims).where(
      and(eq(giftCodeClaims.userId, userId), eq(giftCodeClaims.giftCodeId, giftCodeId))
    );
    return !!claim;
  }

  async claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(giftCodeClaims).values({ userId, giftCodeId });
      await tx.update(giftCodes).set({
        currentUses: sql`${giftCodes.currentUses} + 1`
      }).where(eq(giftCodes.id, giftCodeId));
      await tx.update(users).set({
        balance: sql`${users.balance} + ${amount}`
      }).where(eq(users.id, userId));
      await tx.insert(transactions).values({
        userId,
        type: "gift_code",
        amount: amount.toString(),
        description: "Gift code bonus"
      });
    });
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  async getActiveCountries(): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.isActive, true));
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || undefined;
  }

  async createCountry(data: Partial<Country>): Promise<Country> {
    const [country] = await db.insert(countries).values(data as any).returning();
    return country;
  }

  async updateCountry(id: number, data: Partial<Country>): Promise<Country> {
    const [country] = await db.update(countries).set(data as any).where(eq(countries.id, id)).returning();
    return country;
  }

  async deleteCountry(id: number): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  // Payment Numbers
  async getPaymentNumbers(): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers).orderBy(desc(paymentNumbers.createdAt));
  }

  async getPaymentNumber(id: number): Promise<PaymentNumber | undefined> {
    const [num] = await db.select().from(paymentNumbers).where(eq(paymentNumbers.id, id));
    return num || undefined;
  }

  async getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.country, country), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.insert(paymentNumbers).values(data as any).returning();
    return num;
  }

  async updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.update(paymentNumbers).set(data as any).where(eq(paymentNumbers.id, id)).returning();
    return num;
  }

  async deletePaymentNumber(id: number): Promise<void> {
    await db.delete(paymentNumbers).where(eq(paymentNumbers.id, id));
  }

  // Staking Products
  async getStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts).orderBy(stakingProducts.createdAt);
  }

  async getActiveStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts)
      .where(eq(stakingProducts.isActive, true))
      .orderBy(stakingProducts.launchDate);
  }

  async getStakingProduct(id: number): Promise<StakingProduct | undefined> {
    const [sp] = await db.select().from(stakingProducts).where(eq(stakingProducts.id, id));
    return sp || undefined;
  }

  async createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.insert(stakingProducts).values(data as any).returning();
    return sp;
  }

  async updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.update(stakingProducts).set(data as any).where(eq(stakingProducts.id, id)).returning();
    return sp;
  }

  async deleteStakingProduct(id: number): Promise<void> {
    await db.delete(stakingProducts).where(eq(stakingProducts.id, id));
  }

  async purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking> {
    const sp = await this.getStakingProduct(stakingProductId);
    if (!sp) throw new Error("Staking product not found");
    if (!sp.isActive) throw new Error("Staking product is inactive");

    const now = new Date();
    if (sp.launchDate && new Date(sp.launchDate) > now) {
      throw new Error("This product is not yet available for purchase");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    if (parseFloat(user.balance) < sp.price) {
      throw new Error(`Insufficient balance. You are missing ${(sp.price - parseFloat(user.balance)).toLocaleString()} PHP`);
    }

    // Check user has at least one active regular product
    const activeProds = await db.select().from(userProducts)
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    if (activeProds.length === 0) {
      throw new Error("You must own an active product before accessing staking");
    }

    const releaseDate = new Date(now.getTime() + sp.lockDays * 24 * 60 * 60 * 1000);

    const [staking] = await db.insert(userStakings).values({
      userId,
      stakingProductId,
      amountPaid: sp.price,
      returnAmount: sp.returnAmount,
      purchasedAt: now,
      releaseDate,
      status: "active",
    }).returning();

    // Deduct balance
    const newBalance = (parseFloat(user.balance) - sp.price).toFixed(2);
    await this.updateUser(userId, { balance: newBalance });

    await this.createTransaction({
      userId,
      type: "staking",
      amount: (-sp.price).toString(),
      description: `Staking: ${sp.name}`,
    });

    return staking;
  }

  async getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .where(eq(userStakings.userId, userId))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product }));
  }

  async getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts, user: users })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .innerJoin(users, eq(userStakings.userId, users.id))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product, user: r.user }));
  }

  async releaseMaturedStakings(): Promise<void> {
    const now = new Date();
    const matured = await db.select().from(userStakings)
      .where(and(eq(userStakings.status, "active"), lte(userStakings.releaseDate, now)));

    for (const staking of matured) {
      try {
        const user = await this.getUser(staking.userId);
        if (!user) continue;
        const newBalance = (parseFloat(user.balance) + staking.returnAmount).toFixed(2);
        await this.updateUser(staking.userId, { balance: newBalance });
        await db.update(userStakings)
          .set({ status: "released", releasedAt: now })
          .where(eq(userStakings.id, staking.id));
        await this.createTransaction({
          userId: staking.userId,
          type: "staking_release",
          amount: staking.returnAmount.toString(),
          description: `Staking release #${staking.id}`,
        });
      } catch (e) {
        console.error("Error releasing staking:", staking.id, e);
      }
    }
  }
}

export const storage = new DatabaseStorage();
