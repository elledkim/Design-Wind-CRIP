AEP <- function(test_value, riskCat, lifespan, buildYear, countyData) {
  past_i = 1984 # first year of past climate
  past_m = 2000 # middle year of past climate
  past_f = 2015 # last year of past climate
  future_i = 2070 # first year of future climate
  future_f = 2100 # last year of future climate
  past = c(countyData$Scale_Past[1], countyData$Shape_Past[1])
  future = c(countyData$Scale_Future[1], countyData$Shape_Future[1])
  GPD_past = countyData$GPD_Fit_Past[1]
  GPD_future = countyData$GPD_Fit_Future[1]
  u_past = GPD_past[[1]][["threshold"]]
  u_future = GPD_future[[1]][["threshold"]]
  lambda_past = GPD_past[[1]][["npp"]]*GPD_past[[1]][["pat"]]
  lambda_future = countyData$Freq[1]*GPD_future[[1]][["pat"]]
  year = seq(from = buildYear, by = 1, length.out = lifespan)
  coeff_p = (future_f - year)/(future_f - past_m)
  coeff_f = (year - past_m)/(future_f - past_m)
  for (a in 1:lifespan) {
    if (year[a] <= past_m) {
      coeff_p[a] = 1
      coeff_f[a] = 0
    }
    if (year[a] >= future_f) {
      coeff_p[a] = 0
      coeff_f[a] = 1
    }
  }
  sigma = coeff_p*past[1] + coeff_f*future[1] # should be an array for each year
  xi = coeff_p*past[2] + coeff_f*future[2] # array
  u = coeff_p*u_past + coeff_f*u_future # array
  lambda = coeff_p*lambda_past + coeff_f*lambda_future # array
  lat = countyData$Latitude
  long = countyData$Longitude
  NTC_coeff = c(countyData$NTC_1, countyData$NTC_2)
  
  # Calculate AEPs over the lifetime:
  
  AEP_life = array(0, dim = c(lifespan))
  for (k in 1:lifespan) {
    xi[xi==0]=-0.00000001
    m = 1
    p_TC = prod(exp(-lambda[k]*(1+xi[k]/sigma[k]*(test_value-u[k]))^(-1/xi[k])), na.rm = TRUE)
    p_NTC = (exp(-exp(-(test_value-NTC_coeff[1])/NTC_coeff[2])))^m
    AEP_life[k] <- 1-p_NTC*p_TC
  }
  
  # Use the worst wind year AEP to determine what risk category it is actually in
  worst_AEP = max(AEP_life)
  return(worst_AEP)
  
}