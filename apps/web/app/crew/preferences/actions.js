"use server";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobPreferences = updateJobPreferences;
exports.markPreferencesComplete = markPreferencesComplete;
exports.loadJobMatches = loadJobMatches;
var server_1 = require("@/lib/supabase/server");
var cache_1 = require("next/cache");
var matcher_1 = require("@lighthouse/ai/matcher");
var candidate_cv_1 = require("@/lib/utils/candidate-cv");
function updateJobPreferences(candidateId, data) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, updateData, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, server_1.createClient)()];
                case 1:
                    supabase = _a.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_a.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, { success: false, error: "Not authenticated" }];
                    }
                    updateData = {
                        updated_at: new Date().toISOString(),
                    };
                    if (data.industryPreference !== undefined) {
                        updateData.industry_preference = data.industryPreference;
                    }
                    // Yacht preferences
                    if (data.yachtPrimaryPosition !== undefined) {
                        updateData.yacht_primary_position = data.yachtPrimaryPosition;
                    }
                    if (data.yachtSecondaryPositions !== undefined) {
                        updateData.yacht_secondary_positions = data.yachtSecondaryPositions;
                    }
                    if (data.yachtSizeMin !== undefined) {
                        updateData.preferred_yacht_size_min = data.yachtSizeMin;
                    }
                    if (data.yachtSizeMax !== undefined) {
                        updateData.preferred_yacht_size_max = data.yachtSizeMax;
                    }
                    if (data.contractTypes !== undefined) {
                        updateData.preferred_contract_types = data.contractTypes;
                    }
                    if (data.regions !== undefined) {
                        updateData.preferred_regions = data.regions;
                    }
                    if (data.leavePackage !== undefined) {
                        updateData.leave_package = data.leavePackage;
                    }
                    // Salary & Availability
                    if (data.salaryCurrency !== undefined) {
                        updateData.salary_currency = data.salaryCurrency;
                    }
                    if (data.salaryMin !== undefined) {
                        updateData.desired_salary_min = data.salaryMin;
                    }
                    if (data.salaryMax !== undefined) {
                        updateData.desired_salary_max = data.salaryMax;
                    }
                    if (data.availabilityStatus !== undefined) {
                        updateData.availability_status = data.availabilityStatus;
                    }
                    if (data.availableFrom !== undefined) {
                        updateData.available_from = data.availableFrom;
                    }
                    // Household preferences
                    if (data.householdPrimaryPosition !== undefined) {
                        updateData.household_primary_position = data.householdPrimaryPosition;
                    }
                    if (data.householdSecondaryPositions !== undefined) {
                        updateData.household_secondary_positions = data.householdSecondaryPositions;
                    }
                    if (data.householdLocations !== undefined) {
                        updateData.household_locations = data.householdLocations;
                    }
                    if (data.livingArrangement !== undefined) {
                        updateData.living_arrangement = data.livingArrangement;
                    }
                    // Couple info
                    if (data.isCouple !== undefined) {
                        updateData.is_couple = data.isCouple;
                    }
                    if (data.partnerName !== undefined) {
                        updateData.partner_name = data.partnerName;
                    }
                    if (data.partnerPosition !== undefined) {
                        updateData.partner_position = data.partnerPosition;
                    }
                    return [4 /*yield*/, supabase
                            .from("candidates")
                            .update(updateData)
                            .eq("id", candidateId)];
                case 3:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error("[updateJobPreferences] Error:", error);
                        return [2 /*return*/, { success: false, error: error.message }];
                    }
                    (0, cache_1.revalidatePath)("/crew/preferences");
                    (0, cache_1.revalidatePath)("/crew/dashboard");
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
function markPreferencesComplete(candidateId) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, server_1.createClient)()];
                case 1:
                    supabase = _a.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_a.sent()).data.user;
                    if (!user) {
                        return [2 /*return*/, { success: false, error: "Not authenticated" }];
                    }
                    return [4 /*yield*/, supabase
                            .from("candidates")
                            .update({
                            preferences_completed_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                            .eq("id", candidateId)];
                case 3:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error("[markPreferencesComplete] Error:", error);
                        return [2 /*return*/, { success: false, error: error.message }];
                    }
                    (0, cache_1.revalidatePath)("/crew/preferences");
                    (0, cache_1.revalidatePath)("/crew/dashboard");
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
function loadJobMatches(candidateId_1) {
    return __awaiter(this, arguments, void 0, function (candidateId, options) {
        var supabase, _a, user, authError, _b, limit, _c, minScore, _d, industry, _e, includeAISummary, candidateSelectFields, _f, userData, userDataError, candidate, _g, candidateByUserId, candidateByUserIdError, _h, candidateByEmail, candidateByEmailError, _j, candidateById, candidateByIdError, profileStatus, hasCV, _k, matches, metadata, canQuickApply, matchesWithQuickApply;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    console.log("[loadJobMatches] Entry:", { candidateId: candidateId, options: options });
                    return [4 /*yield*/, (0, server_1.createClient)()];
                case 1:
                    supabase = _l.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    _a = _l.sent(), user = _a.data.user, authError = _a.error;
                    console.log("[loadJobMatches] Auth result:", {
                        hasUser: !!user,
                        userId: user === null || user === void 0 ? void 0 : user.id,
                        userEmail: user === null || user === void 0 ? void 0 : user.email,
                        authError: authError === null || authError === void 0 ? void 0 : authError.message
                    });
                    if (!user) {
                        console.log("[loadJobMatches] Not authenticated");
                        return [2 /*return*/, { success: false, error: "Not authenticated" }];
                    }
                    _b = options.limit, limit = _b === void 0 ? 10 : _b, _c = options.minScore, minScore = _c === void 0 ? 30 : _c, _d = options.industry, industry = _d === void 0 ? "both" : _d, _e = options.includeAISummary, includeAISummary = _e === void 0 ? true : _e;
                    candidateSelectFields = "\n    id, first_name, last_name, email,\n    primary_position, yacht_primary_position, yacht_secondary_positions,\n    household_primary_position, household_secondary_positions, secondary_positions,\n    years_experience,\n    preferred_yacht_types, preferred_yacht_size_min, preferred_yacht_size_max,\n    preferred_regions, preferred_contract_types,\n    household_locations, living_arrangement,\n    desired_salary_min, desired_salary_max, salary_currency,\n    availability_status, available_from,\n    has_stcw, stcw_expiry, has_eng1, eng1_expiry, highest_license,\n    has_schengen, has_b1b2, has_c1d,\n    nationality, second_nationality,\n    is_smoker, has_visible_tattoos, is_couple, partner_position,\n    verification_tier, embedding\n  ";
                    return [4 /*yield*/, supabase
                            .from("users")
                            .select("id")
                            .eq("auth_id", user.id)
                            .maybeSingle()];
                case 3:
                    _f = _l.sent(), userData = _f.data, userDataError = _f.error;
                    console.log("[loadJobMatches] Users table lookup:", {
                        hasUserData: !!userData,
                        userDataId: userData === null || userData === void 0 ? void 0 : userData.id,
                        hasError: !!userDataError,
                        error: userDataError === null || userDataError === void 0 ? void 0 : userDataError.message,
                    });
                    candidate = null;
                    if (!userData) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from("candidates")
                            .select(candidateSelectFields)
                            .eq("user_id", userData.id)
                            .maybeSingle()];
                case 4:
                    _g = _l.sent(), candidateByUserId = _g.data, candidateByUserIdError = _g.error;
                    console.log("[loadJobMatches] Candidate lookup by user_id:", {
                        hasCandidate: !!candidateByUserId,
                        candidateId: candidateByUserId === null || candidateByUserId === void 0 ? void 0 : candidateByUserId.id,
                        hasError: !!candidateByUserIdError,
                        error: candidateByUserIdError === null || candidateByUserIdError === void 0 ? void 0 : candidateByUserIdError.message,
                    });
                    if (candidateByUserId) {
                        candidate = candidateByUserId;
                    }
                    _l.label = 5;
                case 5:
                    if (!(!candidate && user.email)) return [3 /*break*/, 7];
                    return [4 /*yield*/, supabase
                            .from("candidates")
                            .select(candidateSelectFields)
                            .eq("email", user.email)
                            .maybeSingle()];
                case 6:
                    _h = _l.sent(), candidateByEmail = _h.data, candidateByEmailError = _h.error;
                    console.log("[loadJobMatches] Candidate lookup by email:", {
                        hasCandidate: !!candidateByEmail,
                        candidateId: candidateByEmail === null || candidateByEmail === void 0 ? void 0 : candidateByEmail.id,
                        hasError: !!candidateByEmailError,
                        error: candidateByEmailError === null || candidateByEmailError === void 0 ? void 0 : candidateByEmailError.message,
                        userEmail: user.email,
                    });
                    if (candidateByEmail) {
                        candidate = candidateByEmail;
                    }
                    _l.label = 7;
                case 7:
                    if (!(!candidate && candidateId)) return [3 /*break*/, 9];
                    return [4 /*yield*/, supabase
                            .from("candidates")
                            .select(candidateSelectFields)
                            .eq("id", candidateId)
                            .maybeSingle()];
                case 8:
                    _j = _l.sent(), candidateById = _j.data, candidateByIdError = _j.error;
                    console.log("[loadJobMatches] Candidate lookup by candidateId:", {
                        hasCandidate: !!candidateById,
                        candidateId: candidateById === null || candidateById === void 0 ? void 0 : candidateById.id,
                        hasError: !!candidateByIdError,
                        error: candidateByIdError === null || candidateByIdError === void 0 ? void 0 : candidateByIdError.message,
                        providedCandidateId: candidateId,
                    });
                    if (candidateById) {
                        candidate = candidateById;
                    }
                    _l.label = 9;
                case 9:
                    console.log("[loadJobMatches] Final candidate check:", {
                        hasCandidate: !!candidate,
                        candidateId: candidate === null || candidate === void 0 ? void 0 : candidate.id,
                    });
                    if (!candidate) {
                        console.error("[loadJobMatches] Candidate fetch error: No candidate found for user", user.id);
                        return [2 /*return*/, { success: false, error: "Could not load candidate profile" }];
                    }
                    profileStatus = (0, matcher_1.checkProfileCompleteness)(candidate);
                    return [4 /*yield*/, (0, candidate_cv_1.candidateHasCV)(supabase, candidate.id)];
                case 10:
                    hasCV = _l.sent();
                    return [4 /*yield*/, (0, matcher_1.matchJobsForCandidate)(supabase, {
                            candidateId: candidateId,
                            limit: limit,
                            minScore: minScore,
                            industry: industry,
                            includeAISummary: includeAISummary,
                        })];
                case 11:
                    _k = _l.sent(), matches = _k.matches, metadata = _k.metadata;
                    canQuickApply = profileStatus.canQuickApply && hasCV;
                    matchesWithQuickApply = matches.map(function (match) { return (__assign(__assign({}, match), { canQuickApply: canQuickApply && !match.hasApplied })); });
                    return [2 /*return*/, {
                            success: true,
                            matches: matchesWithQuickApply,
                            profile: {
                                completeness: profileStatus.completeness,
                                canQuickApply: canQuickApply,
                                missingFields: profileStatus.missingFields,
                                hasCV: hasCV,
                                candidateId: candidate.id,
                            },
                            metadata: __assign(__assign({}, metadata), { industry: industry, limit: limit, minScore: minScore }),
                        }];
            }
        });
    });
}
