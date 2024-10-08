design_wind_static <- function(riskCat, lifespan, buildYear, countyData){
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
  lambda_future = countyData$Freq[[1]]*GPD_future[[1]][["pat"]]
  year = seq(from = buildYear, by = 1, length.out = lifespan)
  coeff_p = 1
  # coeff_f = (year - past_m)/(future_f - past_m)
  # for (i in 1:lifespan) {
  #   if (year[i] <= past_m) {
  #     coeff_p[i] = 1
  #     coeff_f[i] = 0
  #   }
  #   if (year[i] >= future_f) {
  #     coeff_p[i] = 0
  #     coeff_f[i] = 1
  #   }
  # }
  sigma = coeff_p*past[1]
  xi = coeff_p*past[2] 
  u = coeff_p*u_past
  
  lambda = coeff_p*lambda_past
  ASCE = c(300,700,1700,3000)
  lifetime_ASCE = 50
  MRI = ASCE[riskCat]
  LEP = 1-(1-1/MRI)^lifetime_ASCE
  xd = xu(LEP, countyData$Latitude, countyData$Longitude, sigma, xi, u, lambda,
          c(countyData$NTC_1, countyData$NTC_2))
  return(xd)
}