nonstationary_return_AEP <- function(thresh, lifespan, buildYear, countyData){
  past_i = 1984 # first year of past climate
  past_m = 2000 # middle year of past climate
  past_f = 2015 # last year of past climate
  future_i = 2070 # first year of future climate
  future_f = 2100 # last year of future climate
  if (!is.na(countyData$Scale_Future[1])) {
    past = c(countyData$Scale_Past[1], countyData$Shape_Past[1])
    future = c(countyData$Scale_Future[1], countyData$Shape_Future[1])
    GPD_past = countyData$GPD_Fit_Past[1]
    GPD_future = countyData$GPD_Fit_Future[1]
    u_past = GPD_past[[1]][["threshold"]]
    u_future = GPD_future[[1]][["threshold"]]
    lambda_past = GPD_past[[1]][["npp"]]*GPD_past[[1]][["pat"]]
    lambda_future = countyData$Freq[[1]]*GPD_future[[1]][["pat"]]
    year = c(buildYear,buildYear+lifespan-1)
    
    coeff_p = (future_f - year)/(future_f - past_m)
    coeff_f = (year - past_m)/(future_f - past_m)
    for (i in 1:2) {
      if (year[i] <= past_m) {
        coeff_p[i] = 1
        coeff_f[i] = 0
      }
      if (year[i] >= future_f) {
        coeff_p[i] = 0
        coeff_f[i] = 1
      }
    }
    sigma = coeff_p*past[1] + coeff_f*future[1]
    xi = coeff_p*past[2] + coeff_f*future[2]
    u = coeff_p*u_past + coeff_f*u_future
    
    lambda = coeff_p*lambda_past + coeff_f*lambda_future
    
    #ASCE = c(0.0033,0.0014,0.00059,0.00033) # AEP values for each risk cat
    ASCE = c(300,700,1700,3000)
    N = 1/thresh

    lat = countyData$Latitude
    long = countyData$Longitude
    NTC_coeff = c(countyData$NTC_1,countyData$NTC_2)
    test_value_i = ceiling(max(u))
    MRI = 0
    AEP = 0
    xi[xi==0]=-0.00000001
    while (N>MRI) { # 1/MRI is less than the AEP threshold
      T_TC = (1-exp(-lambda[1]*(1+(xi[1]*(test_value_i-u[1])/
                                     (sigma[1])))^(-1/xi[1])))^(-1)
      if (is.na(T_TC))
        T_TC = Inf
      T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
      MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
      if (MRI < 0) {
        MRI = 0
      }
      test_value_i = test_value_i + 1
      if (MRI != 0) AEP = 1/MRI
      else AEP = 0
    }
    test_value_f = ceiling(max(u))
    MRI = 0
    AEP = 0
    while (N>MRI) {
      T_TC = (1-exp(-lambda[2]*(1+(xi[2]*(test_value_f-u[2])/
                                     (sigma[2])))^(-1/xi[2])))^(-1)
      if (is.na(T_TC))
        T_TC = Inf
      T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
      MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
      if (MRI < 0) {
        MRI = 0
      }
      test_value_f = test_value_f + 1
      if (MRI != 0) AEP = 1/MRI
      else AEP = 0
    }
    xd = max(test_value_i,test_value_f) - 1
  }
  if (is.na(countyData$Scale_Future[1] == 0)) {
    past = c(countyData$Scale_Past[1], countyData$Shape_Past[1])
    GPD_past = countyData$GPD_Fit_Past[1]
    u_past = GPD_past[[1]][["threshold"]]
    lambda_past = GPD_past[[1]][["npp"]]*GPD_past[[1]][["pat"]]
    #ASCE = c(0.0033,0.0014,0.00059,0.00033) # AEP values for each risk cat
    ASCE = c(300,700,1700,3000)
    N = 1/thresh

    lat = countyData$Latitude
    long = countyData$Longitude
    sigma = past[1]
    xi = past[2]
    u = u_past
    lambda = lambda_past
    NTC_coeff = c(countyData$NTC_1, countyData$NTC_2)
    
    test_value_i = ceiling(max(u))
    MRI = 0
    AEP = 0
    xi[xi==0]=-0.00000001
    while (N>MRI) { # 1/MRI is less than the AEP threshold
      T_TC = (1-exp(-lambda[1]*(1+(xi[1]*(test_value_i-u[1])/
                                     (sigma[1])))^(-1/xi[1])))^(-1)
      if (is.na(T_TC))
        T_TC = Inf
      T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
      MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
      if (MRI < 0) {
        MRI = 0
      }
      test_value_i = test_value_i + 1
      if (MRI != 0) AEP = 1/MRI
      else AEP = 0
    }
    test_value_f = ceiling(max(u))
    MRI = 0
    AEP = 0
    while (N>MRI) {
      T_TC = (1-exp(-lambda[2]*(1+(xi[2]*(test_value_f-u[2])/
                                     (sigma[2])))^(-1/xi[2])))^(-1)
      if (is.na(T_TC))
        T_TC = Inf
      T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
      MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
      if (MRI < 0) {
        MRI = 0
      }
      test_value_f = test_value_f + 1
      if (MRI != 0) AEP = 1/MRI
      else AEP = 0
    }
    xd = max(test_value_i,test_value_f) - 1
  }
  return(xd)
}