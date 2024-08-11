design_wind_MRI_static <- function(cat, lifespan, buildYear, countyData, txd){
  past_i = 1984 # first year of past climate
  past_m = 2000 # middle year of past climate
  past_f = 2015 # last year of past climate
  future_i = 2070 # first year of future climate
  future_f = 2015 # last year of future climate
  past = c(countyData$Scale_Past[1], countyData$Shape_Past[1])
  future = c(countyData$Scale_Future[1], countyData$Shape_Future[1])
  GPD_past = countyData$GPD_Fit_Past[1]
  GPD_future = countyData$GPD_Fit_Future[1]
  u_past = GPD_past[[1]][["threshold"]]
  u_future = GPD_future[[1]][["threshold"]]
  lambda_past = GPD_past[[1]][["npp"]]*GPD_past[[1]][["pat"]]
  lambda_future = countyData$Freq[1]*GPD_future[[1]][["pat"]]
  year = seq(from = buildYear, by = 1, length.out = lifespan)
  coeff_p = 1
  coeff_f = (year - past_m)/(future_f - past_m)
  # for (b in 1:lifespan) {
  #   if (year[b] <= past_m) {
  #     coeff_p[b] = 1
  #     coeff_f[b] = 0
  #   }
  #   if (year[b] >= future_f) {
  #     coeff_p[b] = 0
  #     coeff_f[b] = 1
  #   }
  # }
  sigma = coeff_p*past[1] 
  xi = coeff_p*past[2]
  u = coeff_p*u_past
  lambda = coeff_p*lambda_past
  lat = countyData$Latitude
  long = countyData$Longitude
  NTC_coeff = c(countyData$NTC_1, countyData$NTC_2)
  xi[xi==0]=-0.00000001
  m = 1
  
  # for this county and scenario, make a design wind that results in a max AEP over the lifetime smaller than 1/ASCE[cat]
  ASCE = c(300,700,1700,3000)
  thresh = 1/ASCE[cat]
  # Calculate AEP:
  xd = txd
  all_AEP = array(0,dim=c(lifespan))
  for (k in 1:lifespan) {
    p_TC = prod(exp(-lambda[k]*(1+xi[k]/sigma[k]*(xd-u[k]))^(-1/xi[k])), na.rm = TRUE)
    p_NTC = (exp(-exp(-(xd-NTC_coeff[1])/NTC_coeff[2])))^m
    all_AEP[k] <- 1-p_NTC*p_TC
  }
  maxAEP = max(all_AEP)
  while(maxAEP > thresh) {
    xd = xd + 1
    # calculate the new maxAEP
    all_AEP = array(0,dim=c(lifespan))
    for (k in 1:lifespan) {
      p_TC = prod(exp(-lambda[k]*(1+xi[k]/sigma[k]*(xd-u[k]))^(-1/xi[k])), na.rm = TRUE)
      p_NTC = (exp(-exp(-(xd-NTC_coeff[1])/NTC_coeff[2])))^m
      all_AEP[k] <- 1-p_NTC*p_TC
    }
    maxAEP = max(all_AEP)
  }

  return(xd)
}